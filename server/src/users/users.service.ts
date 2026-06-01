import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('El usuario solicitado no existe.');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, role } = createUserDto;
    
    // Validar si el correo ya está registrado
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('El usuario solicitado no existe.');
    }

    const { email, password, name, role } = updateUserDto;
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (email !== undefined) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        // Validar que el nuevo correo no esté registrado por otro usuario
        const duplicate = await this.prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (duplicate) {
          throw new BadRequestException('El correo electrónico ya se encuentra registrado por otro usuario.');
        }
        updateData.email = cleanEmail;
      }
    }

    if (password !== undefined && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('El usuario solicitado no existe.');
    }

    // Bloquear que el usuario se elimine a sí mismo
    if (id === currentUserId) {
      throw new BadRequestException('No puedes eliminar tu propio usuario.');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
