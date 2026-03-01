import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        const adminSecret = process.env.ADMIN_SECRET_TOKEN;
        const employeeSecret = process.env.EMPLOYEE_SECRET_TOKEN;

        if (!adminSecret) {
            return NextResponse.json(
                { message: 'El servidor no tiene configurada una clave de administrador' },
                { status: 500 }
            );
        }

        let role = "";
        if (password === adminSecret) {
            role = "admin";
        } else if (employeeSecret && password === employeeSecret) {
            role = "employee";
        }

        if (role) {
            const response = NextResponse.json(
                { message: 'Autenticación exitosa', role },
                { status: 200 }
            );

            // Setea una cookie HTTPOnly que expira en 7 días
            response.cookies.set({
                name: 'admin_token',
                value: role,
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            });

            return response;
        } else {
            return NextResponse.json(
                { message: 'Contraseña incorrecta' },
                { status: 401 }
            );
        }
    } catch (_error) {
        return NextResponse.json(
            { message: 'Ocurrió un error inesperado' },
            { status: 500 }
        );
    }
}
