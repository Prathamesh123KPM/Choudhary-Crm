<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$dataFile = __DIR__ . '/leads.json';
$leads = [];

if (file_exists($dataFile)) {
    $raw = file_get_contents($dataFile);
    $decoded = json_decode($raw, true);
    if (isset($decoded['leads']) && is_array($decoded['leads'])) {
        $leads = $decoded['leads'];
    } elseif (is_array($decoded)) {
        $leads = $decoded;
    }
}

function saveLeads($dataFile, $leads) {
    file_put_contents($dataFile, json_encode([
        'success' => true,
        'count' => count($leads),
        'leads' => $leads
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$userId = isset($_SERVER['HTTP_X_USER_ID']) ? trim($_SERVER['HTTP_X_USER_ID']) : (isset($_GET['userId']) ? trim($_GET['userId']) : 'admin-001');

$heenaTeam = [
    'admin-002', 'emp-001', 'emp-002', 'emp-003',
    'emp-004', 'emp-005', 'emp-006', 'emp-007', 'emp-008'
];

if ($method === 'GET') {
    if (empty($userId) || $userId === 'admin-001' || strtolower($userId) === 'owner-01' || strpos(strtolower($userId), 'kishan') !== false) {
        echo json_encode([
            'success' => true,
            'role' => 'owner',
            'count' => count($leads),
            'leads' => $leads
        ]);
        exit();
    }

    if ($userId === 'admin-002' || strtolower($userId) === 'head-01' || strpos(strtolower($userId), 'heena') !== false) {
        $filtered = array_values(array_filter($leads, function($l) use ($heenaTeam) {
            $assigned = isset($l['assignedEmployeeId']) ? $l['assignedEmployeeId'] : '';
            return in_array($assigned, $heenaTeam) || empty($assigned);
        }));
        echo json_encode([
            'success' => true,
            'role' => 'team_leader',
            'count' => count($filtered),
            'leads' => $filtered
        ]);
        exit();
    }

    // Employee
    $filtered = array_values(array_filter($leads, function($l) use ($userId) {
        return (isset($l['assignedEmployeeId']) && $l['assignedEmployeeId'] === $userId) ||
               (isset($l['assigned_to']) && $l['assigned_to'] === $userId);
    }));

    echo json_encode([
        'success' => true,
        'role' => 'employee',
        'count' => count($filtered),
        'leads' => $filtered
    ]);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'POST') {
    // Check if assign endpoint
    if (isset($body['leadIds']) && isset($body['employeeId'])) {
        $leadIds = (array)$body['leadIds'];
        $empId = $body['employeeId'];
        $empName = isset($body['employeeName']) ? $body['employeeName'] : '';

        foreach ($leads as &$l) {
            $lid = isset($l['id']) ? $l['id'] : '';
            $mlid = isset($l['metaLeadId']) ? $l['metaLeadId'] : '';
            if (in_array($lid, $leadIds) || in_array($mlid, $leadIds)) {
                $l['assignedEmployeeId'] = $empId;
                $l['assignedEmployeeName'] = $empName;
                $l['assigned_to'] = $empId;
                $l['assignedTo'] = $empId;
                if (isset($l['subStatus']) && $l['subStatus'] === 'Unassigned') {
                    $l['subStatus'] = 'Assigned';
                }
                $l['updatedAt'] = date('c');
            }
        }
        unset($l);
        saveLeads($dataFile, $leads);
        echo json_encode(['success' => true, 'count' => count($leadIds)]);
        exit();
    }

    // Check if bulk status
    if (isset($body['leadIds']) && isset($body['stage'])) {
        $leadIds = (array)$body['leadIds'];
        $stage = $body['stage'];
        $subStatus = isset($body['subStatus']) ? $body['subStatus'] : '';

        foreach ($leads as &$l) {
            $lid = isset($l['id']) ? $l['id'] : '';
            $mlid = isset($l['metaLeadId']) ? $l['metaLeadId'] : '';
            if (in_array($lid, $leadIds) || in_array($mlid, $leadIds)) {
                $l['stage'] = $stage;
                if (!empty($subStatus)) $l['subStatus'] = $subStatus;
                $l['updatedAt'] = date('c');
            }
        }
        unset($l);
        saveLeads($dataFile, $leads);
        echo json_encode(['success' => true, 'count' => count($leadIds)]);
        exit();
    }

    // Create lead
    $newLead = array_merge([
        'id' => 'lead-' . round(microtime(true) * 1000),
        'customerName' => 'New Lead',
        'phone' => '',
        'source' => 'Manual Call',
        'stage' => 'New lead',
        'subStatus' => 'Unassigned',
        'priority' => 'Hot',
        'createdAt' => date('c'),
        'updatedAt' => date('c')
    ], $body);

    array_unshift($leads, $newLead);
    saveLeads($dataFile, $leads);
    echo json_encode(['success' => true, 'lead' => $newLead]);
    exit();
}

if ($method === 'PATCH' || $method === 'PUT') {
    $uri = $_SERVER['REQUEST_URI'];
    $leadId = basename(parse_url($uri, PHP_URL_PATH));
    if ($leadId === 'leads.php' || $leadId === 'leads') {
        $leadId = isset($_GET['id']) ? $_GET['id'] : '';
    }

    $updated = false;
    foreach ($leads as &$l) {
        $lid = isset($l['id']) ? $l['id'] : '';
        $mlid = isset($l['metaLeadId']) ? $l['metaLeadId'] : '';
        if ($lid === $leadId || $mlid === $leadId) {
            foreach ($body as $k => $v) {
                $l[$k] = $v;
            }
            if (isset($body['assigned_to'])) {
                $l['assignedEmployeeId'] = $body['assigned_to'];
                $l['assignedTo'] = $body['assigned_to'];
            }
            $l['updatedAt'] = date('c');
            $updated = $l;
            break;
        }
    }
    unset($l);

    if ($updated) {
        saveLeads($dataFile, $leads);
        echo json_encode(['success' => true, 'lead' => $updated]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Lead not found']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
