import { getServerSession } from 'next-auth'
import { SendCard } from '../../../components/SendCard'
import { authOptions } from '../../lib/auth'
import prisma from '@repo/db/client'
import { BalanceCard } from '../../../components/BalanceCard'
import { P2PTransfer } from '../../../components/P2PTransfer'

async function getBalance() {
  const session = await getServerSession(authOptions)
  const balance = await prisma.balance.findFirst({
    where: {
      userId: Number(session?.user?.id),
    },
  })
  return {
    amount: balance?.amount || 0,
    locked: balance?.locked || 0,
  }
}

async function getP2PTransactions() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("User session not found");
  }

  const userId = Number(session.user.id);

  const txns = await prisma.p2pTransfer.findMany({
    where: {
      OR: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    }
  });

  return txns.map(t => ({
    time: new Date(t.timestamp),
    amount: t.amount,
    type: t.fromUserId === userId ? 'DEBIT' : 'CREDIT',
    userId: t.fromUserId === userId ? t.toUserId : t.fromUserId
  }));
}

export default async function () {
  const balance = await getBalance()
  const transactions = await getP2PTransactions()

  return (
    <div className='w-screen'>
      <div className='text-4xl text-[#6a51a6] pt-8 mb-8 font-bold'>
        P2P Transfer
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 p-4'>
        <div>
          <SendCard />
        </div>
        <div>
          <BalanceCard amount={balance.amount} locked={balance.locked} />
          <div className='pt-4'>
            <P2PTransfer transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  )
}