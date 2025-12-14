// ============================================
// FICHIER : backend/scripts/seed_complete.js
// Script de seed complet pour tester l'application
// ============================================

const { sequelize, User, Player, Team, Pool, Event, Match } = require('../models');
const bcrypt = require('bcrypt');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

function log(message, type = 'info') {
    const color = type === 'success' ? colors.green
        : type === 'error' ? colors.red
            : type === 'warning' ? colors.yellow
                : type === 'header' ? colors.blue + colors.bold
                    : type === 'subheader' ? colors.cyan
                        : type === 'dim' ? colors.dim
                            : colors.reset;
    console.log(`${color}${message}${colors.reset}`);
}

function separator() {
    console.log(colors.dim + '─'.repeat(60) + colors.reset);
}

// Data for realistic scenario
const COMPANIES = [
    'Tech Solutions',
    'Innov Digital',
    'Data Systems',
    'Cloud Services',
    'Cyber Security',
    'AI Dynamics',
    'Web Factory',
    'Smart Apps',
    'Dev Studio',
    'Code Masters',
    'Digital Wave',
    'Net Experts'
];

const FIRST_NAMES = [
    'Jean', 'Paul', 'Pierre', 'Jacques', 'Michel', 'David',
    'Thomas', 'Nicolas', 'Julien', 'Antoine', 'Lucas', 'Maxime',
    'Alexandre', 'Romain', 'Kevin', 'Sebastien', 'Mathieu', 'Vincent',
    'Francois', 'Guillaume', 'Olivier', 'Stephane', 'Christophe', 'Philippe',
    'Eric', 'Patrick', 'Laurent', 'Frederic', 'Marc', 'Bruno',
    'Alain', 'Bernard', 'Christian', 'Daniel', 'Emmanuel', 'Fabrice',
    'Gerard', 'Henri', 'Ivan', 'Jerome', 'Karl', 'Louis'
];

const LAST_NAMES = [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard',
    'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent',
    'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux',
    'Vincent', 'Fournier', 'Morel', 'Girard', 'Andre', 'Lefevre',
    'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Francois', 'Martinez',
    'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guerin',
    'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin', 'Morin'
];

// Generate unique license number
let licenseCounter = 100000;
function generateLicense() {
    licenseCounter++;
    return `L${licenseCounter}`;
}

// Generate random date
function randomDate(startYear, endYear) {
    const year = startYear + Math.floor(Math.random() * (endYear - startYear));
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate random score
function randomScore() {
    const scores = [
        { team1: '6-4, 6-3', team2: '4-6, 3-6' },
        { team1: '6-2, 6-4', team2: '2-6, 4-6' },
        { team1: '6-1, 6-2', team2: '1-6, 2-6' },
        { team1: '7-5, 6-4', team2: '5-7, 4-6' },
        { team1: '7-6, 6-4', team2: '6-7, 4-6' },
        { team1: '6-3, 3-6, 6-4', team2: '3-6, 6-3, 4-6' },
        { team1: '4-6, 6-3, 7-5', team2: '6-4, 3-6, 5-7' },
        { team1: '6-4, 4-6, 6-3', team2: '4-6, 6-4, 3-6' },
        { team1: '3-6, 6-4, 6-2', team2: '6-3, 4-6, 2-6' },
        { team1: '6-7, 6-4, 7-6', team2: '7-6, 4-6, 6-7' },
    ];
    return scores[Math.floor(Math.random() * scores.length)];
}

async function seedDatabase() {
    console.log('\n');
    log('╔══════════════════════════════════════════════════════════╗', 'header');
    log('║       PADEL CORPO - SEED COMPLET DE DONNEES              ║', 'header');
    log('╚══════════════════════════════════════════════════════════╝', 'header');
    console.log('\n');

    try {
        // Connect to database
        await sequelize.authenticate();
        log('Connexion à la base de données établie.', 'success');

        // Reset database
        separator();
        log('🗑️  Nettoyage de la base de données...', 'warning');
        separator();

        await Match.destroy({ where: {}, force: true });
        await Event.destroy({ where: {}, force: true });
        await Team.destroy({ where: {}, force: true });
        await Pool.destroy({ where: {}, force: true });
        await Player.destroy({ where: {}, force: true });
        await User.destroy({ where: { role: 'JOUEUR' }, force: true });

        log('     ✅ Base de données nettoyée', 'success');

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: CREATE ADMIN USER
        // ═══════════════════════════════════════════════════════════════
        separator();
        log('\n👤 ETAPE 1: Création du compte admin', 'header');
        separator();

        const existingAdmin = await User.findOne({ where: { email: 'admin@padel.com' } });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            await User.create({
                email: 'admin@padel.com',
                password_hash: hashedPassword,
                role: 'ADMINISTRATEUR',
                is_active: true
            });
            log('     ✅ Admin créé: admin@padel.com / Admin123!', 'success');
        } else {
            log('     ✅ Admin existe déjà: admin@padel.com / Admin123!', 'success');
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: CREATE PLAYERS (4 per company = 48 players)
        // ═══════════════════════════════════════════════════════════════
        separator();
        log('\n📋 ETAPE 2: Création des joueurs (48 joueurs)', 'header');
        separator();

        const players = [];
        let playerIndex = 0;

        for (const company of COMPANIES) {
            log(`\n  🏢 ${company}`, 'subheader');

            for (let i = 0; i < 4; i++) {
                const firstName = FIRST_NAMES[playerIndex % FIRST_NAMES.length];
                const lastName = LAST_NAMES[playerIndex % LAST_NAMES.length];

                const player = await Player.create({
                    firstName,
                    lastName,
                    company,
                    licenseNumber: generateLicense(),
                    birthDate: randomDate(1975, 2000)
                });

                players.push({ ...player.toJSON(), companyName: company });
                log(`     ✅ ${firstName} ${lastName} (${player.licenseNumber})`, 'dim');
                playerIndex++;
            }
        }

        log(`\n  📊 Total joueurs créés: ${players.length}`, 'success');

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: CREATE USER ACCOUNTS FOR SOME PLAYERS
        // ═══════════════════════════════════════════════════════════════
        separator();
        log('\n🔐 ETAPE 3: Création des comptes utilisateurs', 'header');
        separator();

        const userPlayers = players.slice(0, 12); // 12 first players get accounts
        for (const player of userPlayers) {
            const email = `${player.firstName.toLowerCase()}.${player.lastName.toLowerCase()}@padel.com`;
            const hashedPassword = await bcrypt.hash('Player123!', 10);

            const user = await User.create({
                email,
                password_hash: hashedPassword,
                role: 'JOUEUR',
                is_active: true
            });

            await Player.update({ userId: user.id }, { where: { id: player.id } });
            log(`     ✅ ${email}`, 'dim');
        }

        log(`\n  📊 Total comptes créés: ${userPlayers.length}`, 'success');
        log('     Mot de passe: Player123!', 'dim');

        // ═══════════════════════════════════════════════════════════════
        // STEP 4: CREATE TEAMS (2 per company = 24 teams)
        // ═══════════════════════════════════════════════════════════════
        separator();
        log('\n👥 ETAPE 4: Création des équipes (24 équipes)', 'header');
        separator();

        const teams = [];
        const teamsByCompany = {};

        for (const company of COMPANIES) {
            log(`\n  🏢 ${company}`, 'subheader');

            const companyPlayers = players.filter(p => p.companyName === company);
            teamsByCompany[company] = [];

            for (let i = 0; i < 2; i++) {
                const p1 = companyPlayers[i * 2];
                const p2 = companyPlayers[i * 2 + 1];

                if (!p1 || !p2) continue;

                const team = await Team.create({
                    company,
                    player1Id: p1.id,
                    player2Id: p2.id
                });

                teams.push(team.toJSON());
                teamsByCompany[company].push(team.toJSON());
                log(`     ✅ ${p1.firstName} ${p1.lastName} & ${p2.firstName} ${p2.lastName}`, 'dim');
            }
        }

        log(`\n  📊 Total équipes créées: ${teams.length}`, 'success');

        // ═══════════════════════════════════════════════════════════════
        // STEP 5: CREATE POOLS (4 pools of 6 teams)
        // ═══════════════════════════════════════════════════════════════
        separator();
        log('\n🏆 ETAPE 5: Création des poules (4 poules)', 'header');
        separator();

        const pools = [];
        const poolNames = ['Poule A', 'Poule B', 'Poule C', 'Poule D'];

        // Reorganize teams: first team from each company, then second team
        // This ensures each pool has teams from different companies
        const firstTeams = []; // First team from each company
        const secondTeams = []; // Second team from each company

        for (const company of COMPANIES) {
            const companyTeams = teams.filter(t => t.company === company);
            if (companyTeams[0]) firstTeams.push(companyTeams[0]);
            if (companyTeams[1]) secondTeams.push(companyTeams[1]);
        }

        // Mix teams so different companies are in same pool
        // Pool A: companies 0,1,2 first teams + companies 0,1,2 second teams (but interleaved)
        // Better: take 6 different companies per pool
        const allTeams = [];
        // Pool A: first teams from companies 0-5
        allTeams.push(...firstTeams.slice(0, 6));
        // Pool B: first teams from companies 6-11
        allTeams.push(...firstTeams.slice(6, 12));
        // Pool C: second teams from companies 0-5
        allTeams.push(...secondTeams.slice(0, 6));
        // Pool D: second teams from companies 6-11
        allTeams.push(...secondTeams.slice(6, 12));

        for (let p = 0; p < 4; p++) {
            const poolTeams = allTeams.slice(p * 6, (p + 1) * 6);

            if (poolTeams.length === 6) {
                const pool = await Pool.create({
                    name: `${poolNames[p]} - Saison 2025`
                });

                // Assign teams to pool
                for (const team of poolTeams) {
                    await Team.update({ poolId: pool.id }, { where: { id: team.id } });
                }

                pools.push(pool.toJSON());
                log(`\n  🏆 ${poolNames[p]} - Saison 2025`, 'subheader');
                poolTeams.forEach(t => log(`     - ${t.company}`, 'dim'));
            }
        }

        log(`\n  📊 Total poules créées: ${pools.length}`, 'success');

        // ═══════════════════════════════════════════════════════════════
        // STEP 6: CREATE EVENTS AND MATCHES
        // ═══════════════════════════════════════════════════════════════
        separator();
        log('\n📅 ETAPE 6: Création des événements et matchs', 'header');
        separator();

        const events = [];
        const today = new Date();

        // Round-robin schedule for 6 teams (each team plays every other team once)
        // Format: [team1Index, team2Index] for each match
        const roundRobinSchedule = [
            // Journée 1
            [[0, 1], [2, 3], [4, 5]],
            // Journée 2
            [[0, 2], [1, 4], [3, 5]],
            // Journée 3
            [[0, 3], [1, 5], [2, 4]],
            // Journée 4
            [[0, 4], [1, 3], [2, 5]],
            // Journée 5
            [[0, 5], [1, 2], [3, 4]],
            // Journée 6 (repeat J1 for more data)
            [[0, 1], [2, 5], [3, 4]],
        ];

        // Use teams from first pool (first 6 teams)
        const poolTeams = allTeams.slice(0, 6);

        // Create 6 journées (past, present, future)
        for (let j = 0; j < 6; j++) {
            const eventDate = new Date(today);
            eventDate.setDate(today.getDate() + (j - 2) * 7); // -2 weeks to +3 weeks

            const event = await Event.create({
                eventDate: eventDate.toISOString().split('T')[0],
                eventTime: '19:00'
            });

            events.push(event.toJSON());

            const isPast = eventDate < today;
            const status = isPast ? 'Terminée' : (j === 2 ? 'Aujourd\'hui' : 'À venir');
            log(`\n  📅 Journée ${j + 1} (${eventDate.toLocaleDateString('fr-FR')}) - ${status}`, 'subheader');

            // Create matches for this journée
            const journeeMatches = roundRobinSchedule[j];
            let courtNum = 1;

            for (const [t1Idx, t2Idx] of journeeMatches) {
                const team1 = poolTeams[t1Idx];
                const team2 = poolTeams[t2Idx];

                if (team1 && team2) {
                    // Prepare match data - set scores directly at creation for past matches
                    const matchData = {
                        eventId: event.id,
                        team1Id: team1.id,
                        team2Id: team2.id,
                        courtNumber: courtNum,
                        status: isPast ? 'TERMINE' : 'A_VENIR'
                    };

                    // Add scores for past matches directly at creation
                    if (isPast) {
                        const score = randomScore();
                        const winner = Math.random() > 0.5 ? 1 : 2;
                        matchData.scoreTeam1 = winner === 1 ? score.team1 : score.team2;
                        matchData.scoreTeam2 = winner === 1 ? score.team2 : score.team1;
                    }

                    await Match.create(matchData);
                    log(`     Piste ${courtNum}: ${team1.company} vs ${team2.company}`, 'dim');
                    courtNum++;
                }
            }
        }

        log(`\n  📊 Total événements créés: ${events.length}`, 'success');

        // Count total matches
        const totalMatches = await Match.count();
        log(`  📊 Total matchs créés: ${totalMatches}`, 'success');

        // ═══════════════════════════════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════════════════════════════
        separator();
        log('\n📋 RESUME FINAL', 'header');
        separator();

        const completedMatches = await Match.count({ where: { status: 'TERMINE' } });
        const upcomingMatches = await Match.count({ where: { status: 'A_VENIR' } });

        console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │                    DONNEES CREEES                       │
  ├─────────────────────────────────────────────────────────┤
  │  👤 Joueurs:            ${String(players.length).padStart(3)}                            │
  │  🔐 Comptes joueurs:    ${String(userPlayers.length).padStart(3)}                            │
  │  👥 Équipes:            ${String(teams.length).padStart(3)}                            │
  │  🏆 Poules:             ${String(pools.length).padStart(3)}                            │
  │  📅 Événements:         ${String(events.length).padStart(3)}                            │
  │  🎾 Matchs terminés:    ${String(completedMatches).padStart(3)}                            │
  │  ⏳ Matchs à venir:     ${String(upcomingMatches).padStart(3)}                            │
  ├─────────────────────────────────────────────────────────┤
  │                    COMPTES DE TEST                      │
  ├─────────────────────────────────────────────────────────┤
  │  Admin:    admin@padel.com / Admin123!                  │
  │  Joueur:   jean.martin@padel.com / Player123!           │
  │  Joueur:   paul.bernard@padel.com / Player123!          │
  │  Joueur:   pierre.dubois@padel.com / Player123!         │
  └─────────────────────────────────────────────────────────┘
        `);

        console.log('\n');
        log('╔══════════════════════════════════════════════════════════╗', 'header');
        log('║              ✅ SEED TERMINE AVEC SUCCES                 ║', 'header');
        log('╚══════════════════════════════════════════════════════════╝', 'header');
        console.log('\n');

    } catch (error) {
        log(`\n❌ Erreur: ${error.message}`, 'error');
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

// Run
seedDatabase();
