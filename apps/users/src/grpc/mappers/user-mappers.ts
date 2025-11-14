// mapper.ts
import {
  UserRole,
  CreateUserDTO as CreateUserProtoDTO,
  User as ProtoUser,
} from 'proto';
import { CreateUserDTO as CreateUserEntityDTO } from '../../users/dto/create-user.dto';
import { Roles, User } from '../../users/entities/user.entity';

export function mapProtoRoleToEntityRole(protoRole: UserRole): Roles {
  switch (protoRole) {
    case UserRole.ADMIN:
      return Roles.ADMIN;
    case UserRole.USER:
      return Roles.USER;
    default:
      throw new Error(`Unknown role: ${protoRole}`);
  }
}
export function mapProtoToEntityDto(
  protoDto: CreateUserProtoDTO,
): CreateUserEntityDTO {
  return {
    password: protoDto.password,
    email: protoDto.email,
    bio: protoDto.bio ?? '',
    firstName: protoDto.firstName,
    lastName: protoDto.lastName,
    role: mapProtoRoleToEntityRole(protoDto.role),
  };
}

export let emptyProtoUser: ProtoUser = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: '', // or role default
  Id: '',
  bio: '',
  isActive: false,
  image: '',
};

export function mapUserToProto(user: Partial<User>): ProtoUser {
  if (!user) return emptyProtoUser;
  return {
    Id: user?.Id ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    bio: user.bio ?? '',
    email: user.email ?? '',
    image: user.image ?? '',
    isActive: user.isActive ?? false,
    password: user.password ?? '',
    role: user.role ?? '',
  };
}
