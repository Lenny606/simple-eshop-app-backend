import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {JWT_EXPIRES_IN, JWT_SECRET} from "../env.js";
import prisma from "../lib/prisma.js";

export const signUp = async (req, res, next) => {
    try {
        const {email, password, firstName, lastName} = req.body;

        // Check if user exists using Prisma
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            const err = new Error(`User with email ${email} already exists`)
            err.status = 409;
            throw err
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPass = await bcrypt.hash(password, salt)

        // Create new user with transaction
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPass,
                    firstName,
                    lastName
                }
            });

            return user;
        });

        // Generate JWT
        const token = jwt.sign({id: newUser.id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN})

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;

        // Response
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                token,
                user: userWithoutPassword
            }
        });

    } catch (err) {
        next(err)
    }
}

export const signIn = async (req, res, next) => {
    try {
        const {email, password} = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            const err = new Error(`User not found`)
            err.status = 404;
            throw err
        }

        // Security check
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            const err = new Error(`Invalid password`)
            err.status = 401;
            throw err
        }

        const token = jwt.sign({userId: user.id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN})

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // Response
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                token,
                user: userWithoutPassword
            }
        });

    } catch (err) {
        next(err)
    }
}

export const signOut = async (req, res, next) => {
    // Implementation will be added later
}