# Code Review & Architectural Improvements (toDo)

Generated on: 2026-08-12

---

## 🚨 `[MUST-FIX]` Critical & High-Priority Issues

### 1. Unhandled SyntaxError in Global Exception Filter

- **Location**: `libs/nowhere-common/src/filters/http-exception-filter.ts` (Line 19)
- **Problem**:
  ```ts
  let exception_error = exception.getResponse();
  if (typeof exception_error === 'string')
    exception_error = JSON.parse(exception_error) as Object;
  ```
  If `exception.getResponse()` returns a plain text string (e.g. `'User not found!'`), `JSON.parse` throws a unhandled `SyntaxError`, crashing the filter.
- **Action**: Check if the string is valid JSON before parsing, or wrap non-JSON string responses into `{ message: exception_error }`.

---

### 2. N+1 gRPC Network Call in Loop

- **Location**: `apps/snaps/src/snaps/snaps/snaps.service.ts` (Lines 298–304)
- **Problem**:
  ```ts
  for (const snap of nearSnaps) {
    let seenSnap = await firstValueFrom(
      this.usersService.notSeenSnaps({ userID, seen, snapID: snap.id }),
    );
  }
  ```
  Executes an individual synchronous gRPC network request per snap in a loop.
- **Action**: Create a batch gRPC method `notSeenSnapsBatch({ userID, snapIDs: [...] })` to query all seen states in a single request.

---

### 3. Orphaned Credentials on Signup Profile Creation Failure

- **Location**: `apps/authentication/src/authentication.service.ts` (Lines 94–104)
- **Problem**: If `authUsersService.CreateUserInfo` fails, the error is caught and logged, but execution continues and returns the new credentials. The credentials entity is created in DB without a matching user profile.
- **Action**: Implement a compensating transaction / rollback (e.g., delete created credential if profile creation fails).

---

### 4. Unvalidated File Uploads & Missing DTO Validation

- **Locations**:
  - `apps/users/src/users/users.controller.ts` (Line 40)
  - `apps/gateway/src/gateway.controller.ts` (Line 16)
- **Problem**:
  - `@UploadedFile()` lacks `ParseFilePipe` for mime-type and file-size validation.
  - Gateway routes use `@Body() body: any`, bypassing `ValidationPipe`.
- **Action**: Add `ParseFilePipe` with `FileTypeValidator` & `MaxFileSizeValidator` for uploads. Define `LoginDto` and `SignupDto` with `class-validator` decorators.

---

### 5. Accidental Build Artifacts & Dependencies in `src/`

- **Location**: `libs/nowhere-common/src/dist` & `libs/nowhere-common/src/node_modules`
- **Problem**: Build outputs and dependency directories were generated inside `src/`.
- **Action**: Delete `src/dist` and `src/node_modules`, update `.gitignore` and `tsconfig.json`.

---

## 💡 `[NICE-TO-HAVE]` Refactoring & Clean Code Improvements

### 6. Misspelled File & Class Names

- **Locations**:
  - `apps/snaps/src/snaps/getaway.ts` -> Rename to `gateway.ts` and `SnapsGateway`.
  - `apps/authentication/src/authentication.service.ts` -> Rename `craeteUserCredentials` to `createUserCredentials`.

---

### 7. Overly Deep Folder Nesting

- **Location**: `apps/snaps/src/snaps/snaps/snaps.service.ts`
- **Problem**: Quadruple nesting: `snaps/src/snaps/snaps/snaps.service.ts`.
- **Action**: Flatten path to `apps/snaps/src/snaps/snaps.service.ts`.

---

### 8. Misused `firstValueFrom(await ...)`

- **Locations**:
  - `apps/users/src/users/users.service.ts` (Line 73)
  - `apps/snaps/src/snaps/snaps/snaps.service.ts` (Line 162)
- **Problem**: `firstValueFrom(await client.method())` unnecessarily awaits the observable before passing it to `firstValueFrom`.
- **Action**: Simplify to `firstValueFrom(client.method())`.

---

### 9. Object Wrapper Types vs Primitives & Property Casing

- **Locations**:
  - `apps/snaps/src/snaps/snaps/snaps.service.ts` (Line 205): `location: [Number, Number]`
  - Across Entities & DTOs (`Id`, `id`, `userID`, `snapID`)
- **Action**: Replace `Number` with TS primitive `number`. Standardize ID properties to camelCase (`id`, `userId`, `snapId`).

---

### 10. Direct `process.env` Usage & Duplicate Header Parsing

- **Locations**:
  - `apps/users/src/users/users.service.ts` (Line 68)
  - `apps/gateway/src/gateway.controller.ts` (Line 27)
- **Action**: Use NestJS `ConfigService` for environment access. Use `extractAuthorizationHeader` utility from `nowhere-common` instead of custom `.split(' ')` calls.

---

## 🎯 Recommended Execution Plan

1. **Step 1**: Fix critical runtime & exception safety issues (#1, #3, #4).
2. **Step 2**: Optimize microservice performance (#2).
3. **Step 3**: Clean up build structure & naming typos (#5, #6, #7).
4. **Step 4**: Polish type safety & code hygiene (#8, #9, #10).
