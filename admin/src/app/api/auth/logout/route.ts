import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json(
        { message: 'Sesión cerrada correctamente' },
        { status: 200 }
    );

    response.cookies.delete('admin_token');

    return response;
}
