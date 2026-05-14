import { prisma } from "./lib/prisma"

async function check() {
  const users = await prisma.user.count()
  const logs = await prisma.logEntry.count()
  const threats = await prisma.threatIntelligence.count()
  const alerts = await prisma.securityAlert.count()
  
  console.log("Users:", users)
  console.log("Logs:", logs)
  console.log("Threats:", threats)
  console.log("Alerts:", alerts)
  
  if (users > 0) {
    const user = await prisma.user.findFirst()
    console.log("\nDemo user:", user?.email)
  }
}

check().then(() => process.exit(0))
