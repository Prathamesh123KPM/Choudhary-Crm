<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$identifier = isset($input['identifier']) ? trim($input['identifier']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please enter User ID and Password']);
    exit();
}

$users = [
    [
        'uid' => 'admin-001',
        'id' => 'admin-001',
        'username' => 'kishan',
        'email' => 'kishan@choudharyestate.com',
        'employeeCode' => 'OWNER-01',
        'displayName' => 'Kishan Choudhary',
        'role' => 'owner',
        'designation' => 'Owner & Managing Director',
        'passwords' => ['Choudhary@2026!', 'kishan123', 'Kishan@2026', 'kishan']
    ],
    [
        'uid' => 'admin-002',
        'id' => 'admin-002',
        'username' => 'heena',
        'email' => 'heena@choudharyestate.com',
        'employeeCode' => 'HEAD-01',
        'displayName' => 'Heena',
        'role' => 'team_leader',
        'designation' => 'Team Leader Choudhary Estate',
        'passwords' => ['Heena#Palghar26', 'Heena@2026!', 'Heena@2026', 'heena123', 'heena']
    ],
    [
        'uid' => 'emp-001',
        'id' => 'emp-001',
        'username' => 'surendra',
        'email' => 'surendra.crm@choudharycrm.in',
        'employeeCode' => 'EMP-01',
        'displayName' => 'Surendra',
        'role' => 'employee',
        'designation' => 'CRM and management',
        'passwords' => ['Surendra$CRM26']
    ],
    [
        'uid' => 'emp-002',
        'id' => 'emp-002',
        'username' => 'mahi',
        'email' => 'mahi@choudharycrm.in',
        'employeeCode' => 'EMP-02',
        'displayName' => 'Mahi',
        'role' => 'employee',
        'designation' => 'Sales head Row house',
        'passwords' => ['Mahi#Villas2026']
    ],
    [
        'uid' => 'emp-003',
        'id' => 'emp-003',
        'username' => 'varsha',
        'email' => 'varsha@choudharycrm.in',
        'employeeCode' => 'EMP-03',
        'displayName' => 'Varsha',
        'role' => 'employee',
        'designation' => 'Sales executive + Rent Department',
        'passwords' => ['Varsha*Rent2026']
    ],
    [
        'uid' => 'emp-004',
        'id' => 'emp-004',
        'username' => 'vishal',
        'email' => 'vishal@choudharycrm.in',
        'employeeCode' => 'EMP-04',
        'displayName' => 'Vishal',
        'role' => 'employee',
        'designation' => 'Car management and sales executive',
        'passwords' => ['Vishal@Fleet2026']
    ],
    [
        'uid' => 'emp-005',
        'id' => 'emp-005',
        'username' => 'saloni',
        'email' => 'saloni@choudharycrm.in',
        'employeeCode' => 'EMP-05',
        'displayName' => 'Saloni',
        'role' => 'employee',
        'designation' => 'Telly caller n sales executive',
        'passwords' => ['Saloni#Sales2026']
    ],
    [
        'uid' => 'emp-006',
        'id' => 'emp-006',
        'username' => 'hema',
        'email' => 'hema@choudharycrm.in',
        'employeeCode' => 'EMP-06',
        'displayName' => 'Hema',
        'role' => 'employee',
        'designation' => 'Telly caller n sales executive',
        'passwords' => ['Hema$Palghar26']
    ],
    [
        'uid' => 'emp-007',
        'id' => 'emp-007',
        'username' => 'mohini',
        'email' => 'mohini@choudharycrm.in',
        'employeeCode' => 'EMP-07',
        'displayName' => 'Mohini',
        'role' => 'employee',
        'designation' => 'Telly caller n sales executive',
        'passwords' => ['Mohini%Estate26']
    ],
    [
        'uid' => 'emp-008',
        'id' => 'emp-008',
        'username' => 'achal',
        'email' => 'achal@choudharycrm.in',
        'employeeCode' => 'EMP-08',
        'displayName' => 'Achal',
        'role' => 'employee',
        'designation' => 'Telly caller n sales executive',
        'passwords' => ['Achal@Prithvi26']
    ],
    [
        'uid' => 'emp-009',
        'id' => 'emp-009',
        'username' => 'nitesh',
        'email' => 'nitesh@choudharycrm.in',
        'employeeCode' => 'EMP-09',
        'displayName' => 'Nitesh',
        'role' => 'employee',
        'designation' => 'Rent Head',
        'passwords' => ['Nitesh^Rent2026']
    ],
    [
        'uid' => 'emp-010',
        'id' => 'emp-010',
        'username' => 'surendra-acc',
        'email' => 'surendra.accounts@choudharycrm.in',
        'employeeCode' => 'EMP-10',
        'displayName' => 'Surendra (Accountant)',
        'role' => 'employee',
        'designation' => 'Accountant',
        'passwords' => ['Surendra&Acc2026']
    ]
];

$cleanId = strtolower(trim($identifier));
$matchedUser = null;

foreach ($users as $u) {
    if (
        strtolower($u['uid']) === $cleanId ||
        strtolower($u['username']) === $cleanId ||
        strtolower($u['email']) === $cleanId ||
        strtolower($u['employeeCode']) === $cleanId ||
        strtolower(explode(' ', $u['displayName'])[0]) === $cleanId
    ) {
        $matchedUser = $u;
        break;
    }
}

if (!$matchedUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid ID or password.']);
    exit();
}

$valid = false;
foreach ($matchedUser['passwords'] as $p) {
    if ($password === $p) {
        $valid = true;
        break;
    }
}

if (!$valid) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid ID or password.']);
    exit();
}

unset($matchedUser['passwords']);
echo json_encode([
    'success' => true,
    'user' => $matchedUser,
    'mustChangePassword' => false
]);
