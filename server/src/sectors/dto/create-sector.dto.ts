import { IsNotEmpty, IsInt, Min, IsString } from 'class-validator';

export class CreateSectorDto {
  @IsString({ message: 'El nombre del sector debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del sector es obligatorio' })
  name!: string;

  @IsInt({ message: 'La capacidad total debe ser un número entero' })
  @Min(1, { message: 'La capacidad total debe ser al menos 1' })
  totalCapacity!: number;
}
