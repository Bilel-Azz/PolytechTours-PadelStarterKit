const BASE_URL = 'http://localhost:8000/api/v1';

// Helper for API calls
async function apiCall(method, endpoint, body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error(`Error calling ${endpoint}:`, error.message);
        return { status: 500, error: error.message };
    }
}

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

// Generate unique license number
function generateLicense() {
    const random6 = Math.floor(100000 + Math.random() * 900000);
    return `L${random6}`;
}

// Data for realistic scenario
const COMPANIES = [
    { name: 'Tech Solutions', city: 'Tours' },
    { name: 'Innov Digital', city: 'Paris' },
    { name: 'Data Systems', city: 'Lyon' },
    { name: 'Cloud Services', city: 'Bordeaux' },
    { name: 'Cyber Security', city: 'Nantes' },
    { name: 'AI Dynamics', city: 'Lille' },
];

const FIRST_NAMES = [
    'Jean', 'Paul', 'Pierre', 'Jacques', 'Michel', 'David',
    'Thomas', 'Nicolas', 'Julien', 'Antoine', 'Lucas', 'Maxime',
    'Alexandre', 'Romain', 'Kevin', 'Sebastien', 'Mathieu', 'Vincent',
    'Francois', 'Guillaume', 'Olivier', 'Stephane', 'Christophe', 'Philippe'
];

const LAST_NAMES = [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard',
    'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent',
    'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux',
    'Vincent', 'Fournier', 'Morel', 'Girard', 'Andre', 'Lefevre'
];

async function runScenario() {
    const timestamp = Date.now();

    console.log('\n');
    log('╔══════════════════════════════════════════════════════════╗', 'header');
    log('║       PADEL CORPO - SCENARIO DE TEST COMPLET             ║', 'header');
    log('╚══════════════════════════════════════════════════════════╝', 'header');
    console.log('\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: CREATE PLAYERS (4 players per company = 24 players)
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('📋 ETAPE 1: Création des joueurs', 'header');
    separator();

    const players = [];
    let playerIndex = 0;

    for (const company of COMPANIES) {
        log(`\n  🏢 ${company.name} (${company.city})`, 'subheader');

        for (let i = 0; i < 4; i++) {
            const firstName = FIRST_NAMES[playerIndex % FIRST_NAMES.length];
            const lastName = LAST_NAMES[playerIndex % LAST_NAMES.length];

            const playerData = {
                firstName,
                lastName,
                company: company.name,
                licenseNumber: generateLicense(),
                birthDate: `${1985 + (playerIndex % 15)}-${String((playerIndex % 12) + 1).padStart(2, '0')}-${String((playerIndex % 28) + 1).padStart(2, '0')}`,
            };

            const res = await apiCall('POST', '/players', playerData);
            if (res.status === 201) {
                players.push({ ...res.data.data, companyName: company.name });
                log(`     ✅ ${firstName} ${lastName}`, 'success');
            } else {
                log(`     ❌ Echec: ${firstName} ${lastName} - ${res.data?.error?.message || 'Erreur'}`, 'error');
            }
            playerIndex++;
        }
    }

    log(`\n  📊 Total joueurs créés: ${players.length}/24`, players.length === 24 ? 'success' : 'warning');

    if (players.length < 24) {
        log('\n⚠️  Pas assez de joueurs pour continuer le scénario complet', 'warning');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: CREATE TEAMS (2 teams per company = 12 teams)
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('\n👥 ETAPE 2: Création des équipes', 'header');
    separator();

    const teams = [];
    const teamsByCompany = {};

    for (const company of COMPANIES) {
        log(`\n  🏢 ${company.name}`, 'subheader');

        const companyPlayers = players.filter(p => p.companyName === company.name);
        teamsByCompany[company.name] = [];

        for (let i = 0; i < 2; i++) {
            const p1 = companyPlayers[i * 2];
            const p2 = companyPlayers[i * 2 + 1];

            if (!p1 || !p2) continue;

            const teamData = {
                company: company.name,
                player1Id: p1.id,
                player2Id: p2.id
            };

            const res = await apiCall('POST', '/teams', teamData);
            if (res.status === 201) {
                const team = res.data.data;
                teams.push(team);
                teamsByCompany[company.name].push(team);
                log(`     ✅ Equipe ${i + 1}: ${p1.firstName} ${p1.lastName} & ${p2.firstName} ${p2.lastName}`, 'success');
            } else {
                log(`     ❌ Echec création équipe: ${res.data?.error?.message || 'Erreur'}`, 'error');
            }
        }
    }

    log(`\n  📊 Total équipes créées: ${teams.length}/12`, teams.length === 12 ? 'success' : 'warning');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: NEGATIVE TESTS
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('\n🧪 ETAPE 3: Tests de validation', 'header');
    separator();

    // Test: Mixed company team
    log('\n  Test 1: Equipe avec joueurs d\'entreprises différentes', 'subheader');
    const mixedTeamRes = await apiCall('POST', '/teams', {
        company: COMPANIES[0].name,
        player1Id: players[0].id,
        player2Id: players[4].id // Different company
    });
    if (mixedTeamRes.status === 400) {
        log('     ✅ Rejeté correctement (entreprises différentes)', 'success');
    } else {
        log('     ❌ Aurait dû être rejeté', 'error');
    }

    // Test: Same player twice
    log('\n  Test 2: Même joueur dans les deux positions', 'subheader');
    const samePlayerRes = await apiCall('POST', '/teams', {
        company: COMPANIES[0].name,
        player1Id: players[0].id,
        player2Id: players[0].id
    });
    if (samePlayerRes.status === 400) {
        log('     ✅ Rejeté correctement (même joueur)', 'success');
    } else {
        log('     ❌ Aurait dû être rejeté', 'error');
    }

    // Test: Player already in team
    log('\n  Test 3: Joueur déjà dans une équipe', 'subheader');
    const alreadyInTeamRes = await apiCall('POST', '/teams', {
        company: COMPANIES[0].name,
        player1Id: players[0].id,
        player2Id: players[2].id
    });
    if (alreadyInTeamRes.status === 400) {
        log('     ✅ Rejeté correctement (joueur déjà dans une équipe)', 'success');
    } else {
        log('     ❌ Aurait dû être rejeté', 'error');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: CREATE POOLS (2 pools of 6 teams each)
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('\n🏆 ETAPE 4: Création des poules', 'header');
    separator();

    const pools = [];

    // Pool A: First team of each company
    log('\n  Poule A', 'subheader');
    const poolATeams = COMPANIES.map(c => teamsByCompany[c.name]?.[0]).filter(Boolean);

    if (poolATeams.length === 6) {
        const poolARes = await apiCall('POST', '/pools', {
            name: `Poule A - Edition ${new Date().getFullYear()}`,
            teamIds: poolATeams.map(t => t.id)
        });
        if (poolARes.status === 201) {
            pools.push(poolARes.data.data);
            log('     ✅ Poule A créée avec 6 équipes', 'success');
            poolATeams.forEach(t => log(`        - ${t.company}`, 'dim'));
        } else {
            log(`     ❌ Echec: ${poolARes.data?.error?.message || 'Erreur'}`, 'error');
        }
    }

    // Pool B: Second team of each company
    log('\n  Poule B', 'subheader');
    const poolBTeams = COMPANIES.map(c => teamsByCompany[c.name]?.[1]).filter(Boolean);

    if (poolBTeams.length === 6) {
        const poolBRes = await apiCall('POST', '/pools', {
            name: `Poule B - Edition ${new Date().getFullYear()}`,
            teamIds: poolBTeams.map(t => t.id)
        });
        if (poolBRes.status === 201) {
            pools.push(poolBRes.data.data);
            log('     ✅ Poule B créée avec 6 équipes', 'success');
            poolBTeams.forEach(t => log(`        - ${t.company}`, 'dim'));
        } else {
            log(`     ❌ Echec: ${poolBRes.data?.error?.message || 'Erreur'}`, 'error');
        }
    }

    // Test: Pool with wrong number of teams
    log('\n  Test: Poule avec moins de 6 équipes', 'subheader');
    const invalidPoolRes = await apiCall('POST', '/pools', {
        name: 'Poule Invalide',
        teamIds: [teams[0]?.id, teams[1]?.id].filter(Boolean)
    });
    if (invalidPoolRes.status === 400) {
        log('     ✅ Rejeté correctement (moins de 6 équipes)', 'success');
    } else {
        log('     ❌ Aurait dû être rejeté', 'error');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: CREATE EVENTS WITH MATCHES
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('\n📅 ETAPE 5: Création des événements et matchs', 'header');
    separator();

    const events = [];
    const today = new Date();

    // Event 1: Journée 1 (today)
    log('\n  Journée 1 (Aujourd\'hui)', 'subheader');
    const event1Data = {
        eventDate: today.toISOString().split('T')[0],
        eventTime: '19:00',
        matches: [
            { team1Id: poolATeams[0]?.id, team2Id: poolATeams[1]?.id, courtNumber: 1 },
            { team1Id: poolATeams[2]?.id, team2Id: poolATeams[3]?.id, courtNumber: 2 },
            { team1Id: poolATeams[4]?.id, team2Id: poolATeams[5]?.id, courtNumber: 3 },
        ].filter(m => m.team1Id && m.team2Id)
    };

    const event1Res = await apiCall('POST', '/events', event1Data);
    if (event1Res.status === 201) {
        events.push(event1Res.data.data);
        log(`     ✅ Journée 1 créée avec ${event1Res.data.data.matches?.length || 0} matchs`, 'success');
    } else {
        log(`     ❌ Echec: ${event1Res.data?.error?.message || 'Erreur'}`, 'error');
    }

    // Event 2: Journée 2 (next week)
    log('\n  Journée 2 (Semaine prochaine)', 'subheader');
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const event2Data = {
        eventDate: nextWeek.toISOString().split('T')[0],
        eventTime: '19:00',
        matches: [
            { team1Id: poolATeams[0]?.id, team2Id: poolATeams[2]?.id, courtNumber: 1 },
            { team1Id: poolATeams[1]?.id, team2Id: poolATeams[4]?.id, courtNumber: 2 },
            { team1Id: poolATeams[3]?.id, team2Id: poolATeams[5]?.id, courtNumber: 3 },
        ].filter(m => m.team1Id && m.team2Id)
    };

    const event2Res = await apiCall('POST', '/events', event2Data);
    if (event2Res.status === 201) {
        events.push(event2Res.data.data);
        log(`     ✅ Journée 2 créée avec ${event2Res.data.data.matches?.length || 0} matchs`, 'success');
    } else {
        log(`     ❌ Echec: ${event2Res.data?.error?.message || 'Erreur'}`, 'error');
    }

    // Event 3: Journée 3 (in 2 weeks)
    log('\n  Journée 3 (Dans 2 semaines)', 'subheader');
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    const event3Data = {
        eventDate: twoWeeks.toISOString().split('T')[0],
        eventTime: '19:00',
        matches: [
            { team1Id: poolATeams[0]?.id, team2Id: poolATeams[3]?.id, courtNumber: 1 },
            { team1Id: poolATeams[1]?.id, team2Id: poolATeams[5]?.id, courtNumber: 2 },
            { team1Id: poolATeams[2]?.id, team2Id: poolATeams[4]?.id, courtNumber: 3 },
        ].filter(m => m.team1Id && m.team2Id)
    };

    const event3Res = await apiCall('POST', '/events', event3Data);
    if (event3Res.status === 201) {
        events.push(event3Res.data.data);
        log(`     ✅ Journée 3 créée avec ${event3Res.data.data.matches?.length || 0} matchs`, 'success');
    } else {
        log(`     ❌ Echec: ${event3Res.data?.error?.message || 'Erreur'}`, 'error');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: PLAY MATCHES (Update scores for Event 1)
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('\n🎾 ETAPE 6: Jouer les matchs de la Journée 1', 'header');
    separator();

    if (events[0]) {
        const matchesRes = await apiCall('GET', `/matches?eventId=${events[0].id}`);
        const matches = matchesRes.data?.data || [];

        const scores = [
            { scoreTeam1: '6-4, 6-3', scoreTeam2: '4-6, 3-6', winner: 'Team 1' },
            { scoreTeam1: '4-6, 5-7', scoreTeam2: '6-4, 7-5', winner: 'Team 2' },
            { scoreTeam1: '6-4, 3-6, 7-6', scoreTeam2: '4-6, 6-3, 6-7', winner: 'Team 1' },
        ];

        for (let i = 0; i < matches.length && i < scores.length; i++) {
            const match = matches[i];
            const score = scores[i];

            const updateRes = await apiCall('PUT', `/matches/${match.id}`, {
                status: 'TERMINE',
                scoreTeam1: score.scoreTeam1,
                scoreTeam2: score.scoreTeam2
            });

            if (updateRes.status === 200) {
                const team1Name = match.team1?.company || 'Equipe 1';
                const team2Name = match.team2?.company || 'Equipe 2';
                log(`     ✅ Match ${i + 1}: ${team1Name} vs ${team2Name}`, 'success');
                log(`        Score: ${score.scoreTeam1} / ${score.scoreTeam2} (${score.winner} gagne)`, 'dim');
            } else {
                log(`     ❌ Echec mise à jour match ${i + 1}`, 'error');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 7: CHECK RANKINGS
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('\n📊 ETAPE 7: Classement', 'header');
    separator();

    const rankRes = await apiCall('GET', '/results/rankings');

    if (rankRes.status === 200 && rankRes.data?.data?.rankings) {
        const rankings = rankRes.data.data.rankings;

        console.log('\n');
        console.log('  ┌────┬──────────────────────┬────────┬─────────┬─────────┐');
        console.log('  │ #  │ Entreprise           │ Points │ Matchs  │ Victoires│');
        console.log('  ├────┼──────────────────────┼────────┼─────────┼─────────┤');

        rankings.slice(0, 10).forEach((r, i) => {
            const rank = String(i + 1).padStart(2);
            const company = (r.company || 'N/A').padEnd(20).slice(0, 20);
            const points = String(r.points || 0).padStart(6);
            const matches = String(r.matchesPlayed || 0).padStart(7);
            const wins = String(r.wins || 0).padStart(8);
            console.log(`  │ ${rank} │ ${company} │${points} │${matches} │${wins} │`);
        });

        console.log('  └────┴──────────────────────┴────────┴─────────┴─────────┘');
        console.log('\n');
    } else {
        log('     ⚠️ Classement non disponible', 'warning');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 8: SUMMARY
    // ═══════════════════════════════════════════════════════════════
    separator();
    log('\n📋 RESUME', 'header');
    separator();

    console.log(`
  Données créées:
  ─────────────────────────────────────
  👤 Joueurs:     ${players.length} / 24
  👥 Equipes:     ${teams.length} / 12
  🏆 Poules:      ${pools.length} / 2
  📅 Evénements:  ${events.length} / 3
  🎾 Matchs:      ${events.reduce((sum, e) => sum + (e.matches?.length || 0), 0)}

  Entreprises participantes:
  ─────────────────────────────────────`);

    COMPANIES.forEach(c => {
        const companyTeams = teamsByCompany[c.name] || [];
        console.log(`  🏢 ${c.name}: ${companyTeams.length} équipe(s)`);
    });

    console.log('\n');
    log('╔══════════════════════════════════════════════════════════╗', 'header');
    log('║              ✅ SCENARIO TERMINE AVEC SUCCES             ║', 'header');
    log('╚══════════════════════════════════════════════════════════╝', 'header');
    console.log('\n');
}

// Run the scenario
runScenario().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
