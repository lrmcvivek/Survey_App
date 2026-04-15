import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ulbs = await prisma.ulbMaster.findMany();
  console.log('ULBs:', ulbs);

  const zones = await prisma.zoneMaster.findMany();
  console.log('Zones:', zones);

  const wards = await prisma.wardMaster.findMany();
  console.log('Wards:', wards.length);

  const mapping = await prisma.zoneWardMapping.findMany({
    include: {
      zone: true,
      ward: true,
    }
  });
  console.log('Zone-Ward Mappings:', mapping.length);

  const wardStatuses = await prisma.wardStatusMapping.findMany({
    include: {
      status: true
    }
  });
  console.log('Ward Status Mappings:', wardStatuses);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
