const BASE_URL = 'http://localhost:8000/api/v1';

// Helper for API calls
async function apiCall(method, endpoint, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

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
    bold: '\x1b[1m',
};

function log(message, type = 'info') {
    const color = type === 'success' ? colors.green
        : type === 'error' ? colors.red
            : type === 'header' ? colors.blue + colors.bold
                : colors.reset;
    console.log(`${color}${message}${colors.reset}`);
}

async function runScenario() {
    log('\n🚀 Starting API Test Scenario...\n', 'header');

    // 1. Create Players
    log('1. Creating Players...', 'header');
    const players = [];
    const companies = ['Tech Corp', 'Innov Ltd'];

    const playerNames = [
        'Jean', 'Paul', 'Pierre', 'Jacques', 'Michel', 'David',
        'Thomas', 'Nicolas', 'Julien', 'Antoine', 'Lucas', 'Maxime'
    ];

    const timestamp = Date.now();

    for (let i = 0; i < 12; i++) {
        const company = i < 6 ? companies[0] : companies[1];
        const playerData = {
            firstName: playerNames[i],
            lastName: `Test`,
            company: company,
            licenseNumber: `L${(100000 + i + 1 + (timestamp % 10000)).toString().slice(0, 6)}`,
            birthDate: '1990-01-01',
            email: `player${i + 1}_${timestamp}@example.com`
        };

        // Ensure license format is exactly L + 6 digits
        // If slice made it shorter, pad it
        if (playerData.licenseNumber.length < 7) {
            playerData.licenseNumber = `L${(100000 + i + 1).toString()}`;
        }
        // Actually, let's just use a completely random 6 digit number
        const random6 = Math.floor(100000 + Math.random() * 900000);
        playerData.licenseNumber = `L${random6}`;

        const res = await apiCall('POST', '/players', playerData);
        if (res.status === 201) {
            players.push(res.data.data);
            log(`✅ Created ${playerData.firstName} (${company})`, 'success');
        } else {
            log(`❌ Failed to create player ${i + 1}: ${JSON.stringify(res.data)}`, 'error');
        }
    }

    if (players.length < 12) {
        log('❌ Not enough players created to continue', 'error');
        return;
    }

    // 2. Create Teams
    log('\n2. Creating Teams...', 'header');
    const teams = [];

    // Create 3 teams for Tech Corp
    for (let i = 0; i < 3; i++) {
        const p1 = players[i * 2];
        const p2 = players[i * 2 + 1];

        const teamData = {
            company: 'Tech Corp',
            player1Id: p1.id,
            player2Id: p2.id
        };

        const res = await apiCall('POST', '/teams', teamData);
        if (res.status === 201) {
            teams.push(res.data.data);
            log(`✅ Created Team ${i + 1} (Tech Corp)`, 'success');
        } else {
            log(`❌ Failed to create team: ${JSON.stringify(res.data)}`, 'error');
        }
    }

    // Create 3 teams for Innov Ltd
    for (let i = 0; i < 3; i++) {
        const p1 = players[6 + i * 2];
        const p2 = players[6 + i * 2 + 1];

        const teamData = {
            company: 'Innov Ltd',
            player1Id: p1.id,
            player2Id: p2.id
        };

        const res = await apiCall('POST', '/teams', teamData);
        if (res.status === 201) {
            teams.push(res.data.data);
            log(`✅ Created Team ${i + 4} (Innov Ltd)`, 'success');
        } else {
            log(`❌ Failed to create team: ${JSON.stringify(res.data)}`, 'error');
        }
    }

    // Negative Test: Create team with different companies
    log('\n🧪 Testing Negative Case: Team with different companies', 'yellow');
    const negRes = await apiCall('POST', '/teams', {
        company: 'Tech Corp',
        player1Id: players[0].id, // Tech Corp
        player2Id: players[6].id  // Innov Ltd
    });

    if (negRes.status === 400) {
        log('✅ Correctly rejected team with mixed companies', 'success');
    } else {
        log('❌ Failed: Should have rejected mixed company team', 'error');
    }

    // 3. Create Pool
    log('\n3. Creating Pool...', 'header');
    const poolData = {
        name: `Poule Test ${timestamp}`,
        teamIds: teams.map(t => t.id)
    };

    const poolRes = await apiCall('POST', '/pools', poolData);
    if (poolRes.status === 201) {
        log('✅ Created Pool A with 6 teams', 'success');
    } else {
        log(`❌ Failed to create pool: ${JSON.stringify(poolRes.data)}`, 'error');
        return;
    }

    // 4. Create Event with Matches
    log('\n4. Creating Event with Matches...', 'header');
    const today = new Date().toISOString().split('T')[0];
    const eventData = {
        eventDate: today,
        eventTime: '19:00',
        matches: [
            {
                team1Id: teams[0].id,
                team2Id: teams[3].id,
                courtNumber: 1
            },
            {
                team1Id: teams[1].id,
                team2Id: teams[4].id,
                courtNumber: 2
            },
            {
                team1Id: teams[2].id,
                team2Id: teams[5].id,
                courtNumber: 3
            }
        ]
    };

    const eventRes = await apiCall('POST', '/events', eventData);
    let eventId;
    if (eventRes.status === 201) {
        eventId = eventRes.data.data.id;
        log(`✅ Created Event with ${eventRes.data.data.matches.length} matches`, 'success');
    } else {
        log(`❌ Failed to create event: ${JSON.stringify(eventRes.data)}`, 'error');
        return;
    }

    // 5. Update Match Scores
    log('\n5. Playing Matches (Updating Scores)...', 'header');

    // Get matches for the event
    const matchesRes = await apiCall('GET', `/matches?eventId=${eventId}`);
    const matches = matchesRes.data.data;

    // Match 1: Tech Corp wins
    const match1 = matches[0];
    const update1 = await apiCall('PUT', `/matches/${match1.id}`, {
        status: 'TERMINE',
        scoreTeam1: '6-4, 6-3',
        scoreTeam2: '4-6, 3-6'
    });
    if (update1.status === 200) log('✅ Match 1: Tech Corp wins', 'success');

    // Match 2: Innov Ltd wins
    const match2 = matches[1];
    const update2 = await apiCall('PUT', `/matches/${match2.id}`, {
        status: 'TERMINE',
        scoreTeam1: '4-6, 5-7',
        scoreTeam2: '6-4, 7-5'
    });
    if (update2.status === 200) log('✅ Match 2: Innov Ltd wins', 'success');

    // Match 3: Tech Corp wins in 3 sets
    const match3 = matches[2];
    const update3 = await apiCall('PUT', `/matches/${match3.id}`, {
        status: 'TERMINE',
        scoreTeam1: '6-4, 3-6, 7-6',
        scoreTeam2: '4-6, 6-3, 6-7'
    });
    if (update3.status === 200) log('✅ Match 3: Tech Corp wins (3 sets)', 'success');

    // 6. Check Rankings
    log('\n6. Checking Rankings...', 'header');
    const rankRes = await apiCall('GET', '/results/rankings');

    if (rankRes.status === 200) {
        const rankings = rankRes.data.data.rankings;
        console.table(rankings);

        if (rankings[0].company === 'Tech Corp' && rankings[0].points === 6) {
            log('✅ Rankings Correct: Tech Corp leads with 6 points', 'success');
        } else {
            log('❌ Rankings Incorrect', 'error');
        }
    } else {
        log(`❌ Failed to get rankings: ${JSON.stringify(rankRes.data)}`, 'error');
    }

    log('\n✨ Scenario Completed!', 'header');
}

runScenario();
