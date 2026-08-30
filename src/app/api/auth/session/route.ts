import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Decode token and ensure user document is created/merged in Firestore
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userId = decodedToken.uid;
      const userDocRef = adminDb.collection('users').doc(userId);
      const userDoc = await userDocRef.get();

      await userDocRef.set({
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario',
        email: decodedToken.email || '',
        timezone: 'Europe/Madrid',
        updatedAt: new Date(),
        ...(!userDoc.exists ? {
          createdAt: new Date(),
          whatsappInstance: {
            instanceName: `autocumple-${userId}`,
            status: 'disconnected',
            updatedAt: new Date(),
          },
        } : {}),
      }, { merge: true });
    } catch (dbErr) {
      console.warn('Could not auto-create user profile document:', dbErr);
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  response.cookies.set('__session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
