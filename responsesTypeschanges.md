# Backend Request & Response Contract Changes (`responsesTypeschanges.md`)

This document outlines all request and response shape changes across the backend microservices, including RFC 9457 problem details, the unified success envelope, and before/after comparisons for each endpoint to assist with frontend migration.

---

## 1. Global Response Standards

### 1.1 Success Envelope (HTTP 200, 201)
All successful HTTP endpoints now wrap response data in a uniform envelope:

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
}
```

### 1.2 Error Responses (HTTP 4xx, 5xx) — RFC 9457 Problem Details
All HTTP errors follow the **RFC 9457** standard with `Content-Type: application/problem+json`:

```typescript
interface ApiProblemDetails {
  type: string;        // URI identifying the problem type (defaults to "about:blank")
  title: string;       // Short HTTP status title (e.g., "BadRequest", "NotFound", "Unauthorized")
  status: number;      // HTTP status code (e.g., 400, 401, 404, 500)
  detail: string;      // Human-readable summary (e.g., "Validation failed", "User not found")
  instance: string;    // Request URL path that generated the error (e.g., "/auth/login")
  timestamp: string;   // ISO 8601 timestamp string
  errors?: string[];   // Extension field containing specific validation messages (for 400 Bad Request)
}
```

---

## 2. Detailed Endpoint-by-Endpoint Changes

---

### **A. Gateway Service (Port `3005`)**
*Base File:* `apps/gateway/src/gateway.controller.ts`

| Method & Route | Request Body / Params | Before Response | After Response |
| :--- | :--- | :--- | :--- |
| `GET /` | None | `"Hello World!"` (raw string) | `{"success": true, "data": {"message": "Hello World!"}}` |
| `POST /auth/login` | `{"email": "...", "password": "..."}` | `{"user": {...}, "tokens": {...}}` | `{"success": true, "data": {"user": {...}, "tokens": {...}}}` |
| `POST /auth/signup` | `{"email": "...", "password": "...", "username": "..."}` | `{"user": {...}, "tokens": {...}}` | `{"success": true, "data": {"user": {...}, "tokens": {...}}}` |
| `GET /auth/refresh` | Header: `Authorization: Bearer <refresh_token>` | `{"token": "..."}` | `{"success": true, "data": {"token": "..."}}` |
| `GET /users/me` | Header: `Authorization: Bearer <access_token>` | `{"id": "...", "email": "...", "role": "..."}` | `{"success": true, "data": {"id": "...", "email": "...", "role": "..."}}` |

---

### **B. Authentication Direct Service (Port `3004`)**
*Base File:* `apps/authentication/src/authentication.controller.ts`

| Method & Route | Request Body / Params | Before Response | After Response |
| :--- | :--- | :--- | :--- |
| `POST /auth/login` | **Changed:** Accepts flat `{"email": "...", "password": "..."}` (previously required nested `{"user": {...}}`) | Raw `{user, tokens}` | `{"success": true, "data": {"user": {...}, "tokens": {...}}}` |
| `POST /auth/signup` | **Changed:** Accepts flat `{"email": "...", "password": "...", "username": "..."}` (previously required nested `{"user": {...}}`) | Raw `{user, tokens}` | `{"success": true, "data": {"user": {...}, "tokens": {...}}}` |
| `GET /auth/refresh` | Header: `Authorization: Bearer <refresh_token>` | Raw `{"token": "..."}` | `{"success": true, "data": {"token": "..."}}` |
| `GET /auth/validate` | Header: `Authorization: Bearer <access_token>` | `"valid!"` (raw string) | `{"success": true, "data": {"valid": true, "userId": "..."}}` |

---

### **C. Users Service (Port `3001`)**
*Base File:* `apps/users/src/users/users.controller.ts`

| Method & Route | Request Body / Params | Before Response | After Response |
| :--- | :--- | :--- | :--- |
| `GET /users/id/:id` | Param: `id` | `{"success": true, "data": User}` | `{"success": true, "data": User}` *(unchanged)* |
| `GET /users` | None (Admin only) | `{"success": true, "data": User[]}` | `{"success": true, "data": User[]}` *(unchanged)* |
| `PUT /users/image` | Form Data: `photo` (File) | `{"success": true, "data": {...}}` | `{"success": true, "data": {...}}` *(unchanged)* |
| `GET /users/settings`| Header: `Authorization: Bearer <token>` | `{"success": true, "data": Settings}` | `{"success": true, "data": Settings}` *(unchanged)* |
| `GET /users/:email` | Param: `email` | `{"success": true, "data": User}` | `{"success": true, "data": User}` *(unchanged)* |

---

### **D. Storage Service (Port `3002`)**
*Base File:* `apps/storage/src/aws-storage/aws-storage.controller.ts`

| Method & Route | Request Body / Params | Before Response | After Response |
| :--- | :--- | :--- | :--- |
| `GET /storage/` | None (Admin only) | `["key1.png", "key2.jpg"]` (raw array) | `{"success": true, "data": ["key1.png", "key2.jpg"]}` |
| `GET /storage/signed` | Query: `?key=filename.jpg` | `"https://s3.amazonaws.com/..."` (raw string) | `{"success": true, "data": "https://s3.amazonaws.com/..."}` |

---

### **E. Snaps Service (Port `3000`)**
*Base File:* `apps/snaps/src/snaps/snaps.controller.ts`

| Method & Route | Request Body / Params | Before Response | After Response |
| :--- | :--- | :--- | :--- |
| `POST /snaps` | Multipart Form: `snaps` (files) + Body fields | `{"success": true, "data": Snap}` | `{"success": true, "data": Snap}` *(unchanged)* |
| `GET /snaps` | None (Admin only) | `{"success": true, "data": Snap[]}` | `{"success": true, "data": Snap[]}` *(unchanged)* |
| `GET /snaps/tags` | Query: `?tags=...` | `{"success": true, "data": Snap[]}` | `{"success": true, "data": Snap[]}` *(unchanged)* |
| `GET /snaps/:id` | Param: `id` | `{"success": true, "data": Snap}` | `{"success": true, "data": Snap}` *(unchanged)* |
| `DELETE /snaps` | None (Admin only) | `{"success": true, "data": DeleteResult}` | `{"success": true, "data": DeleteResult}` *(unchanged)* |
| `GET /snaps/near/:lng/:lat` | Params: `lng`, `lat`, Query: `FindSnapDTO` | `{"success": true, "data": Snap[]}` | `{"success": true, "data": Snap[]}` *(unchanged)* |
| `GET /snaps/seen/:lng/:lat` | Params: `lng`, `lat`, Query: `FindSnapDTO` | `{"success": true, "data": Snap[]}` | `{"success": true, "data": Snap[]}` *(unchanged)* |
| `GET /seed` | None | `{"success": true, "data": {...}}` | `{"success": true, "data": {...}}` *(unchanged)* |

---

## 3. Frontend Integration Guide (TypeScript & Axios)

To handle these changes cleanly without needing to rewrite every frontend API call from `res.data` to `res.data.data`, you can use the following Axios client setup:

```typescript
import axios, { AxiosError, AxiosResponse } from 'axios';

// 1. Define Standard Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  errors?: string[];
}

// 2. Configure Axios Instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Response Interceptor for Automatic Unwrapping & Standardized Errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Automatically unpack { success: true, data: T } -> T
    if (
      response.data &&
      typeof response.data === 'object' &&
      response.data.success === true &&
      'data' in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<ApiProblemDetails>) => {
    if (error.response?.data) {
      const problem = error.response.data;

      // Extract field validation messages if available, fallback to detail/title
      const errorMessage =
        (problem.errors && problem.errors.length > 0 ? problem.errors.join(', ') : null) ||
        problem.detail ||
        problem.title ||
        'An unexpected error occurred';

      return Promise.reject(new Error(errorMessage));
    }

    return Promise.reject(error);
  }
);
```
