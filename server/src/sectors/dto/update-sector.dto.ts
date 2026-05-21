import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class UpdateSectorDto {
  @IsString({ message: 'El nombre del sector debe ser texto' })
  @IsOptional()
  name?: string;

  @IsInt({ message: 'La capacidad total debe ser un número entero' })
  @Min(1, { message: 'La capacidad total debe ser al menos 1' })
  @IsOptional()
  totalCapacity?: number;
}
