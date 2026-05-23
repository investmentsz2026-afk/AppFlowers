import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, Matches } from 'class-validator';

export class CreateClientDto {
  @IsString({ message: 'El nombre completo debe ser texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName!: string;

  @IsString({ message: 'El nombre de contacto debe ser texto' })
  @IsOptional()
  contactName?: string;

  @IsString({ message: 'El DNI debe ser texto' })
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener exactamente 8 números' })
  dni!: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'La dirección debe ser texto' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'El tipo de flores debe ser texto' })
  @IsOptional()
  flowers?: string;

  @IsOptional()
  amount?: number;

  @IsString({ message: 'Las observaciones deben ser texto' })
  @IsOptional()
  remarks?: string;

  @IsUUID('4', { message: 'Debe seleccionar un sector válido' })
  @IsOptional()
  sectorId?: string;

  @IsDateString({}, { message: 'La fecha de último pago debe ser una fecha válida' })
  @IsOptional()
  lastPaymentDate?: string;

  @IsDateString({}, { message: 'La fecha de vencimiento debe ser una fecha válida' })
  @IsOptional()
  nextDueDate?: string;
}
