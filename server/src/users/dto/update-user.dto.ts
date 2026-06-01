import { IsOptional, IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsOptional()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsEnum(Role, { message: 'El rol debe ser ADMIN o STAFF' })
  @IsOptional()
  role?: Role;
}
