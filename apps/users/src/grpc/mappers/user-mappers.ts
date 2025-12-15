// mapper.ts
import {
  UserRole,
  CreateUserDTO as CreateUserProtoDTO,
  UserObject as ProtoUser,
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
    email: protoDto.email,
    bio: protoDto.bio ?? '',
    firstName: protoDto.firstName,
    lastName: protoDto.lastName,
  };
}

export let emptyProtoUser: ProtoUser = {
  firstName: '',
  lastName: '',
  email: '',
  Id: '',
  bio: '',
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
  };
}
