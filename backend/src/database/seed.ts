import * as bcrypt from 'bcrypt';
import { db } from './database';
import { users, tournaments } from './schema';

const SALT_ROUNDS = 12;

async function seed() {
  console.log('🌱  Seeding database...');

  // ── 1. Coach ───────────────────────────────────────────────────────────────
  const coachHash = await bcrypt.hash('Coach@123', SALT_ROUNDS);
  const [coach] = await db
    .insert(users)
    .values({
      email: 'coach@koc.com',
      passwordHash: coachHash,
      name: 'Coach Kumar',
      role: 'coach',
    })
    .onConflictDoNothing()
    .returning();

  console.log('  ✓ Coach:', coach?.email ?? 'already exists');

  // ── 2. Students ────────────────────────────────────────────────────────────
  const studentData = [
    { email: 'alice@koc.com',   name: 'Alice Sharma',  password: 'Student@123' },
    { email: 'bob@koc.com',     name: 'Bob Verma',     password: 'Student@123' },
    { email: 'charlie@koc.com', name: 'Charlie Singh', password: 'Student@123' },
    { email: 'diana@koc.com',   name: 'Diana Patel',   password: 'Student@123' },
  ];

  for (const s of studentData) {
    const hash = await bcrypt.hash(s.password, SALT_ROUNDS);
    const [student] = await db
      .insert(users)
      .values({ email: s.email, passwordHash: hash, name: s.name, role: 'student' })
      .onConflictDoNothing()
      .returning();
    console.log('  ✓ Student:', student?.email ?? 'already exists');
  }

  // ── 3. Sample open tournament (if coach was just created) ──────────────────
  if (coach) {
    await db.insert(tournaments).values({
      name: 'Beginner Blitz Cup',
      timeControl: '5+0',
      startAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      status: 'open',
      createdBy: coach.id,
    }).onConflictDoNothing();
    console.log('  ✓ Sample tournament created');
  }

  console.log('✅  Seeding complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
