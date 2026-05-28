import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const users = [
  { id: '1', name: process.env.USER1_NAME!, hash: process.env.USER1_PASS_HASH! },
  { id: '2', name: process.env.USER2_NAME!, hash: process.env.USER2_PASS_HASH! },
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize({ username, password }) {
        const user = users.find(u => u.name === username)
        if (!user) return null
        const valid = await bcrypt.compare(password as string, user.hash)
        if (!valid) return null
        return { id: user.id, name: user.name }
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
