import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsUUID('4', { message: 'Debe ingresar un cliente válido' })
  @IsNotEmpty({ message: 'El cliente es obligatorio' })
  clientId!: string;

  @IsNumber({}, { message: 'El monto debe ser un número decimal o entero' })
  @Min(0.01, { message: 'El monto mínimo a pagar es 0.01' })
  amount!: number;

  @IsEnum(PaymentMethod, { message: 'Debe seleccionar un método de pago válido (CASH, CARD, TRANSFER)' })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  paymentMethod!: PaymentMethod;

  @IsInt({ message: 'Los meses a renovar deben ser un entero' })
  @Min(1, { message: 'El mínimo de meses a renovar es 1' })
  @IsOptional()
  monthsToRenew?: number;

  @IsDateString({}, { message: 'La fecha de inicio de cobertura debe ser una fecha válida' })
  @IsOptional()
  dueDateFrom?: string;

  @IsDateString({}, { message: 'La fecha de fin de cobertura debe ser una fecha válida' })
  @IsOptional()
  dueDateTo?: string;

  @IsString({ message: 'Las observaciones deben ser texto' })
  @IsOptional()
  remarks?: string;
}
