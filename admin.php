<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once('/home/hue06470/exercisescience/private/config.php');

header('Content-Type: application/json');
//--------------------------
//Connecting to the database
//--------------------------

//Create the connection passing in the above variables
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

//If statement to test whether or not the connection succeeded
if($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit();
}

// Detect request type
$contentType = $_SERVER["CONTENT_TYPE"] ?? "";

// --------------------------
// Determine action
// --------------------------
// Try JSON input first
$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON, true);

// If JSON is empty or invalid, fall back to $_POST
if (!is_array($data) || empty($data)) {
    $data = $_POST;
}
// Now get the action
$action = trim($data['action'] ?? '');
if ($action === '') {
    $rawInput = file_get_contents("php://input");
    $jsonData = json_decode($rawInput, true);

    if (is_array($jsonData) && isset($jsonData['action'])) {
        $data = $jsonData; // override safely
        $action = $jsonData['action'];
    }
}
// Display what action was grabbed
//echo json_encode([
//    "success" => true,
//    "action_received" => $action,
//    "raw_input" => $

//exit();

// Temporary: get role from JS
if (isset($_POST['currentRole'])) {
    $_SESSION['role'] = $_POST['currentRole'];
}

switch ($action) {

	// ========================
	// LOAD WELCOME MESSAGE
	// ========================

	case "getIntro":

	    $stmt = $conn->prepare("
		SELECT `Feature ID`, Feature
		FROM `Site Management`
		WHERE `Feature ID` IN ('Header', 'OpMsg', 'FeatVid')
	    ");

	    $stmt->execute();
	    $result = $stmt->get_result();

	    $output = [];

	    while ($row = $result->fetch_assoc()) {
		    $key = trim($row['Feature ID']);
		    $output[$key] = $row['Feature'];
	    }

	    echo json_encode([
		"success" => true,
		"data" => $output
	    ]);

	    $stmt->close();
	    exit();
	
	// =========================
	// EDIT WELCOME INFO
	// =========================

	case "updateIntro":

	    $data = json_decode(file_get_contents("php://input"), true);

	    $fields = [];

	    if (isset($data['Header'])) {
		$stmt = $conn->prepare("
		    UPDATE `Site Management`
		    SET `Feature` = ?
		    WHERE `Feature ID` = 'Header'
		");
		$stmt->bind_param("s", $data['Header']);
		$stmt->execute();
		$stmt->close();
	    }

	    if (isset($data['OpMsg'])) {
		$stmt = $conn->prepare("
		    UPDATE `Site Management`
		    SET `Feature` = ?
		    WHERE `Feature ID` = 'OpMsg'
		");
		$stmt->bind_param("s", $data['OpMsg']);
		$stmt->execute();
		$stmt->close();
	    }

	    if (isset($data['FeatVid'])) {
		$stmt = $conn->prepare("
		    UPDATE `Site Management`
		    SET `Feature` = ?
		    WHERE `Feature ID` = 'FeatVid'
		");
		$stmt->bind_param("s", $data['FeatVid']);
		$stmt->execute();
		$stmt->close();
	    }

	    echo json_encode(["success" => true]);
	    exit();
	

	// =========================
   	//  LOGIN
   	// =========================
   	case "login":
		
		//Get usernname and password trimming whitespace and tabs
		$username = trim($data['username'] ?? '');
		$password = trim($data['password'] ?? '');
		
		//If either usernname or password is empty send error
		if (empty($username) || empty($password)) {
		    echo json_encode(["success" => false, "message" => "Missing fields"]);
		    exit();
		}

		//Prepare a query for SQL to get the hashed password and admin type of the entered username 
		$stmt = $conn->prepare(
		    "SELECT `Password Hash`, `Admin Type`
		     FROM Admins
		     WHERE Username = ?
		     LIMIT 1"
		);

		if (!$stmt) {
		    echo json_encode([
			"success" => false,
			"message" => "Prepare failed: " . $conn->error
		    ]);
		    exit();
		}

		//Actually set the username and execute and store the query result
		$stmt->bind_param("s", $username);
		$stmt->execute();
		$stmt->store_result();
		
		//If there are 0 rows returned than their is no matching username
		if ($stmt->num_rows === 0) {
			echo json_encode([
				"success" => false,
      			"message" => "User not found"
   			 ]);
			exit();
		}
		//Map query columns to variables than retrieve the row data	
		$stmt->bind_result($hashedPassword, $role);
		$stmt->fetch();

		//Normalize roles so they match the javascript
		$normalizedRole = ($role === "Super Admin") ? "super" : "admin";
		
		//Verify that password matches hash
		if (password_verify($password, $hashedPassword)) {
		    //Store user info in session
		    $_SESSION['username'] = $username;
		    $_SESSION['role'] = $normalizedRole;
		    //Send success response
		    echo json_encode([
			"success" => true,
			"role" => $normalizedRole
		    ]);
		//Invalid Password Error
		} else {
		    echo json_encode(["success" => false,
		    "message" => "Invalid username or password"]);
		}
		//Free database resources
		$stmt->close();
		break;

	// =========================
 	// 👤 ADD ADMIN
	// =========================
	case "addAdmin":

        	// 🔐 Only allow super
	        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super') {
        	    	echo json_encode(['success' => false, 'message' => 'Unauthorized']);
           	 	exit();
       		 }

     		    $admin_add_date = date('Y-m-d');

		    $name = trim($data['name'] ?? '');
		    $email = trim($data['email'] ?? '');
		    $id = trim($data['id'] ?? '');
		    $username = trim($data['username'] ?? '');
		    $password = trim($data['password'] ?? '');
		    $role = trim($data['role'] ?? '');
        	// Validation
        	if (!$name || !$email || !$username || !$password) {
            		echo json_encode(['success' => false, 'message' => 'All fields required']);
            		exit();
        	}

		// Check duplicate username
		$checkStmt = $conn->prepare("SELECT `Admin ID` FROM Admins WHERE Username = ?");
		if (!$checkStmt) {
		    echo json_encode([
			'success' => false,
			'message' => 'Check prepare failed: ' . $conn->error
		    ]);
		    exit();
		}
		$checkStmt->bind_param("s", $username);
		$checkStmt->execute();
		$checkStmt->store_result();

		if ($checkStmt->num_rows > 0) {
		    echo json_encode(['success' => false, 'message' => 'Username already exists']);
		    exit();
		}
		$checkStmt->close();

		// Hash password
		$hashed_password = password_hash($password, PASSWORD_DEFAULT);

		// Insert
		$stmt = $conn->prepare(
		    "INSERT INTO Admins (`Full Name`, Email, Username, `Password Hash`, `Admin Type`, `Date Added`, `Admin ID`, `Last Login`) 
		     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
		);

		if (!$stmt) {
		    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
		    exit();
		}

		$stmt->bind_param(
		    "ssssssss",
		    $name,
		    $email,
		    $username,
		    $hashed_password,
		    $role,
		    $admin_add_date,
		    $id,
		    $admin_add_date
		);

		if ($stmt->execute()) {
		    echo json_encode(['success' => true, 'message' => 'Admin created successfully']);
		} else {
		    echo json_encode(['success' => false, 'message' => 'Insert failed: ' . $stmt->error]);
		}

		$stmt->close();
		break;
	// ========================
	//  Add Alumni
	// ========================
	 case "addAlumni":

	    $inputJSON = file_get_contents("php://input");
	    $data = json_decode($inputJSON, true);
	    if (!is_array($data) || empty($data)) {
		$data = $_POST;
	    }

	    // Generate ID
	    $result = $conn->query("SELECT MAX(`PennWest ID`) AS max_id FROM Alumni");

	    if (!$result) {
		echo json_encode([
		    'success' => false,
		    'message' => 'Failed to fetch max ID: ' . $conn->error
		]);
		exit();
	    }

	    $row = $result->fetch_assoc();
	    $id = ($row['max_id'] !== null) ? $row['max_id'] + 1 : 1;

	    // Get fields
	    $name_first = trim($data['first_name'] ?? '');
	    $name_last = trim($data['last_name'] ?? '');
	    $job_title = trim($data['job_title'] ?? '');
	    $employer = trim($data['employer'] ?? '');
	    $job_setting = trim($data['job_setting'] ?? '');
	    $bio = trim($data['bio'] ?? '');
	    $photo_url = trim($data['photo_url'] ?? '');
	    $start_date = trim($data['start_date'] ?? '');
	    $end_date = trim($data['end_date'] ?? '');
	    $program = trim($data['program'] ?? '');
	    $concentration = trim($data['concentration'] ?? '');
	    $alumni_add_date = date('Y-m-d');

	    // Image upload
	    if (isset($_FILES['new_alumni_image']) && $_FILES['new_alumni_image']['error'] === UPLOAD_ERR_OK) {

		$uploadDir = '/cisapps/exercisescience/public_html/Images/Exercise Science Alumni/';

		$fileTmpPath = $_FILES['new_alumni_image']['tmp_name'];
		$fileExt = strtolower(pathinfo($_FILES['new_alumni_image']['name'], PATHINFO_EXTENSION));

		$safeFirstName = preg_replace("/[^a-zA-Z0-9_-]/", "_", $name_first);
		$safeLastName = preg_replace("/[^a-zA-Z0-9_-]/", "_", $name_last);

		$newFileName = "$safeFirstName $safeLastName.$fileExt";
		$destPath = $uploadDir . $newFileName;

		if (!move_uploaded_file($fileTmpPath, $destPath)) {
		    echo json_encode([
			'success' => false,
			'message' => 'Failed to move uploaded image.'
		    ]);
		    exit();
		}
	    }

	    // Insert
	    $stmt = $conn->prepare(
		"INSERT INTO Alumni (`PennWest ID`, `First Name`, `Last Name`, `Job Title`, Employer, `Job Setting`, Bio, `Photo URL`, `Start Date`, `End Date`, Program, Concentration, `Date Updated`, `Date Added`)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
	    );

	    if (!$stmt) {
		echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
		exit();
	    }

	    $stmt->bind_param(
		"ssssssssssssss",
		$id,
		$name_first,
		$name_last,
		$job_title,
		$employer,
		$job_setting,
		$bio,
		$photo_url,
		$start_date,
		$end_date,
		$program,
		$concentration,
		$alumni_add_date,
		$alumni_add_date
	    );

	    if ($stmt->execute()) {
		echo json_encode(['success' => true]);
	    } else {
		echo json_encode(['success' => false, 'message' => $stmt->error]);
	    }

	    $stmt->close();
	    break; 

	// ========================
	// LOAD AWARDS INTO PANEL
	// ========================

	case "getAwards":

	    $result = $conn->query("
		SELECT 
		    `Award Key` AS id, 
		    `Award` AS name 
		FROM Awards
	    ");

	    $awards = [];

	    while ($row = $result->fetch_assoc()) {
		$awards[] = [
		    "id" => $row["id"],
		    "name" => $row["name"]
		];
	    }

	    echo json_encode([
		"success" => true,
		"awards" => $awards
	    ]);

	    exit();
	// =========================
	// GET AWARD FOR EDIT
	// =========================
	
	case "getAwardById":

	    $data = json_decode(file_get_contents("php://input"), true);
	    $id = $data['id'] ?? '';

	    if (!$id) {
		echo json_encode(["success" => false, "message" => "Missing ID"]);
		exit();
	    }

	    $stmt = $conn->prepare("
		SELECT `Award Key` AS id, `Award` AS name
		FROM Awards
		WHERE `Award Key` = ?
	    ");

	    $stmt->bind_param("s", $id);
	    $stmt->execute();
	    $result = $stmt->get_result();

	    if ($row = $result->fetch_assoc()) {
		echo json_encode([
		    "success" => true,
		    "award" => $row
		]);
	    } else {
		echo json_encode([
		    "success" => false,
		    "message" => "Award not found"
		]);
	    }

	    $stmt->close();
	    exit();
	
	// ========================
	// UPDATE AWARDS
	// ========================
	
	case "updateAward":

	    $data = json_decode(file_get_contents("php://input"), true);

	    $id = $data['id'] ?? '';
	    $name = $data['name'] ?? '';

	    if (!$id || !$name) {
		echo json_encode([
		    "success" => false,
		    "message" => "Missing ID or name"
		]);
		exit();
	    }

	    $stmt = $conn->prepare("
		UPDATE Awards
		SET `Award` = ?
		WHERE `Award Key` = ?
	    ");

	    $stmt->bind_param("ss", $name, $id);

	    if ($stmt->execute()) {
		echo json_encode(["success" => true]);
	    } else {
		echo json_encode([
		    "success" => false,
		    "message" => $stmt->error
		]);
	    }

	    $stmt->close();
	    exit();
	// =========================
	// ADD AWARDS
	// =========================

	case "addAward":

	    $data = json_decode(file_get_contents("php://input"), true);
	    $name = $data['name'] ?? '';

	    if (!$name) {
		echo json_encode([
		    "success" => false,
		    "message" => "Missing award name"
		]);
		exit();
	    }

	    // 🔥 Generate unique 7-digit key
	    do {
		$awardKey = rand(1000000, 9999999);

		$checkStmt = $conn->prepare("SELECT 1 FROM Awards WHERE `Award Key` = ?");
		$checkStmt->bind_param("i", $awardKey);
		$checkStmt->execute();
		$checkStmt->store_result();

	    } while ($checkStmt->num_rows > 0);

	    $checkStmt->close();

	    // Insert new award
	    $stmt = $conn->prepare("
		INSERT INTO Awards (`Award Key`, `Award`)
		VALUES (?, ?)
	    ");

	    $stmt->bind_param("is", $awardKey, $name);

	    if ($stmt->execute()) {
		echo json_encode([
		    "success" => true,
		    "id" => $awardKey
		]);
	    } else {
		echo json_encode([
		    "success" => false,
		    "message" => $stmt->error
		]);
	    }

	    $stmt->close();
	    exit();
	// =========================
	// DELETE AWARDS
	// =========================
	
	case "deleteAward":

	    $data = json_decode(file_get_contents("php://input"), true);
	    $id = $data['id'] ?? '';

	    if (!$id) {
		echo json_encode([
		    "success" => false,
		    "message" => "Missing ID"
		]);
		exit();
	    }

	    $stmt = $conn->prepare("
		DELETE FROM Awards
		WHERE `Award Key` = ?
	    ");

	    $stmt->bind_param("i", $id);

	    if ($stmt->execute()) {
		echo json_encode(["success" => true]);
	    } else {
		echo json_encode([
		    "success" => false,
		    "message" => $stmt->error
		]);
	    }

	    $stmt->close();
	    exit();

	// =========================
	// GET ADMIN FOR EDIT PANEL
	// =========================

	case "getAdmins":

	    	$stmt = $conn->prepare("SELECT `Admin ID` as id, `Admin Type` as role, `Full Name` as fullName, Email as email, Username as username  FROM Admins");
	    	$stmt->execute();

	    	$result = $stmt->get_result();

	    	$admins = [];

	    	while ($row = $result->fetch_assoc()) {
			$admins[] = $row;
	    	}

	    	echo json_encode([
			"success" => true,
			"admins" => $admins
	    	]);

	    	exit();
	// ========================
	// UPDATE ADMIN
	// ========================

	case "updateAdmin":
		
		$data = json_decode(file_get_contents('php://input'), true);

		$originalId = $data['originalId'] ?? '';
    		$username = $data['username'] ?? '';
    		$role = $data['role'] ?? '';
    		$fullName = $data['fullName'] ?? '';
    		$email = $data['email'] ?? '';
    		$password = $data['password'] ?? '';

    		if (empty($username) || empty($fullName) || empty($email)) {
        		echo json_encode(["success" => false, "message" => "Missing fields"]);
        		exit();
    		}

    		if (!empty($password)) {
        		$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        		$stmt = $conn->prepare("
            			UPDATE Admins
            			SET Username = ?, `Admin Type` = ?, `Full Name` = ?, Email = ?, `Password Hash` = ?
            			WHERE `Admin ID` = ?
        		");

        		$stmt->bind_param("ssssss", $username, $role, $fullName, $email, $hashedPassword, $originalId);

    		} else {
        		$stmt = $conn->prepare("
            		UPDATE Admins
            		SET Username = ?, `Admin Type` = ?, `Full Name` = ?, Email = ?
            		WHERE `Admin ID` = ?
        		");

        		$stmt->bind_param("sssss", $username, $role, $fullName, $email, $originalId);
    		}

    		if (!$stmt->execute()) {
        		echo json_encode([
            		"success" => false,
            		"message" => "Update failed: " . $stmt->error
        		]);
        		exit();
		}

		echo json_encode([
		    "success" => true,
		    "message" => "Admin updated successfully"
		]);

		break;	
	// =========================
	// DELETE ADMINS
	// =========================

	case "deleteAdmin":

	    $data = json_decode(file_get_contents('php://input'), true);

	    $id = $data['id'] ?? '';

	    if (empty($id)) {
		echo json_encode([
		    "success" => false,
		    "message" => "Missing admin ID"
		]);
		exit();
	    }

	    // 🔐 Optional: restrict to super admins only
	    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super') {
		echo json_encode([
		    "success" => false,
		    "message" => "Unauthorized"
		]);
		exit();
	    }

	    // ❌ Prevent deleting yourself (optional but recommended)
	    if (isset($_SESSION['username']) && $_SESSION['username'] === $id) {
		echo json_encode([
		    "success" => false,
		    "message" => "You cannot delete your own account"
		]);
		exit();
	    }

	    $stmt = $conn->prepare("
		DELETE FROM Admins
		WHERE `Admin ID` = ?
	    ");

	    if (!$stmt) {
		echo json_encode([
		    "success" => false,
		    "message" => "Prepare failed: " . $conn->error
		]);
		exit();
	    }

	    $stmt->bind_param("s", $id);

	    if ($stmt->execute()) {
		echo json_encode([
		    "success" => true,
		    "message" => "Admin deleted successfully"
		]);
	    } else {
		echo json_encode([
		    "success" => false,
		    "message" => "Delete failed: " . $stmt->error
		]);
	    }

	    $stmt->close();
	    break;

	// ========================
	// LOAD ALUMNI INTO EDIT
	// ========================

	case "getAlumni":

	    $stmt = $conn->prepare("
		SELECT
		    `PennWest ID` AS id,
		    `First Name` AS first_name,
		    `Last Name` AS last_name,
		    `Job Title` AS job_title,
		    Employer AS employer,
		    `Job Setting` AS job_setting,
		    `Start Date` AS year_start,
		    `End Date` AS year_grad,
		    Program AS program,
		    Concentration AS concentration,
		    Bio AS bio,
		    `Photo URL` AS image_path
		FROM Alumni
	    ");

	    $stmt->execute();
	    $result = $stmt->get_result();

	    $alumni = [];

	    while ($row = $result->fetch_assoc()) {
		$alumni[] = $row;
	    }

	    echo json_encode([
		"success" => true,
		"alumni" => $alumni
	    ]);

	    exit();

	// ========================
	// UPDATE ALUMNI INFO
	// ========================
	
	   case "updateAlumni":

		    $id = $_POST['id'] ?? '';
		
		    // Get current image path
		    $currentImage = null;

		    $stmtOld = $conn->prepare("SELECT `Photo URL` FROM Alumni WHERE `Pennwest ID` = ?");
		    $stmtOld->bind_param("s", $id);
		    $stmtOld->execute();
		    $resultOld = $stmtOld->get_result();

		    if ($row = $resultOld->fetch_assoc()) {
		         $currentImage = $row['Photo URL'];
		    }   
		    $stmtOld->close();
		

		    $first_name = $_POST['first_name'] ?? '';
		    $last_name = $_POST['last_name'] ?? '';
		    $job_title = $_POST['job_title'] ?? '';
		    $employer = $_POST['employer'] ?? '';
		    $job_setting = $_POST['job_setting'] ?? '';
		    $year_start = $_POST['year_start'] ?? '';
		    $year_grad = $_POST['year_grad'] ?? '';
		    $program = $_POST['program'] ?? '';
		    $concentration = $_POST['concentration'] ?? '';
		    $bio = $_POST['bio'] ?? '';

		    $image_path = null;

			if (isset($_FILES['edit-alumni-image']) && $_FILES['edit-alumni-image']['error'] === 0) {

			    $targetDir = "Images/Exercise Science Alumni/";

			    if (!is_dir($targetDir)) {
				mkdir($targetDir, 0755, true);
			    }

			    // 🔥 DELETE OLD IMAGE FIRST
			    if (!empty($currentImage) && file_exists($currentImage)) {
				unlink($currentImage);
			    }

			    // Create new filename (optional: use First + Last like you wanted)
			    $extension = pathinfo($_FILES["edit-alumni-image"]["name"], PATHINFO_EXTENSION);
			    $newFileName = $first_name . " " . $last_name . "." . $extension;

			    $targetFile = $targetDir . $newFileName;

			    if (move_uploaded_file($_FILES["edit-alumni-image"]["tmp_name"], $targetFile)) {
				$image_path = $targetFile;
			    } else {
				echo json_encode(["success" => false, "message" => "File upload failed"]);
				exit();
			    }
			}

		    // Build query
		    if ($image_path) {
			$stmt = $conn->prepare("
			    UPDATE Alumni SET
				`First Name`=?,
				`Last Name`=?,
				`Job Title`=?,
				Employer=?,
				`Job Setting`=?,
				`Start Date`=?,
				`End Date`=?,
				Program=?,
				Concentration=?,
				Bio=?,
				`Photo URL`=?
			    WHERE `Pennwest ID`=?
			");

			$stmt->bind_param("ssssssssssss",
			    $first_name, $last_name, $job_title, $employer, $job_setting,
			    $year_start, $year_grad, $program, $concentration, $bio,
			    $image_path, $id
			);

		    } else {
			$stmt = $conn->prepare("
			    UPDATE Alumni SET
				`First Name`=?,
				`Last Name`=?,
				`Job Title`=?,
				Employer=?,
				`Job Setting`=?,
				`Start Date`=?,
				`End Date`=?,
				Program=?,
				Concentration=?,
				Bio=?
			    WHERE `Pennwest ID`=?
			");

			$stmt->bind_param("sssssssssss",
			    $first_name, $last_name, $job_title, $employer, $job_setting,
			    $year_start, $year_grad, $program, $concentration, $bio,
			    $id
			);
		    }

		    if ($stmt->execute()) {
			echo json_encode(["success" => true]);
		    } else {
			echo json_encode(["success" => false, "message" => $stmt->error]);
		    }

		    exit();

	// =========================
	// DELETE ALUMNI
	// =========================
	
	case "deleteAlumni":

	    // Get JSON input
	    $data = json_decode(file_get_contents("php://input"), true);
	    $id = $data['id'] ?? '';

	    if (!$id) {
		echo json_encode(["success" => false, "message" => "Missing ID"]);
		exit();
	    }

	    // 1. Get image path
	    $stmt = $conn->prepare("SELECT `Photo URL` FROM Alumni WHERE `Pennwest ID` = ?");
	    $stmt->bind_param("s", $id);
	    $stmt->execute();
	    $result = $stmt->get_result();

	    $imagePath = null;

	    if ($row = $result->fetch_assoc()) {
		$imagePath = $row['Photo URL'];
	    }
	    $stmt->close();

	    // 2. Delete image file
	    if (!empty($imagePath) && file_exists($imagePath)) {
		unlink($imagePath);
	    }

	    // 3. Delete alumni from DB
	    $stmt = $conn->prepare("DELETE FROM Alumni WHERE `Pennwest ID` = ?");
	    $stmt->bind_param("s", $id);

	    if ($stmt->execute()) {
		echo json_encode(["success" => true]);
	    } else {
		echo json_encode(["success" => false, "message" => $stmt->error]);
	    }

	    $stmt->close();
	    exit();
		    
	// =========================
        //  LOAD QUESTIONS FOR FAQ
        // =========================
	   case "saveFAQ":
		$rawInput = file_get_contents("php://input");
    		$data = json_decode($rawInput, true);

    		if (!is_array($data)) {
        		$data = $_POST;
		}
		$faqFile = __DIR__ . "/faq/faqs.json";
		    if (!file_exists($faqFile)) {
        		file_put_contents($faqFile, "[]");
    			}

    		$rawFaqs = file_get_contents($faqFile);
    		$faqs = json_decode($rawFaqs, true);
		$faqs = array_values(array_filter($faqs, function ($item) {
    			return is_array($item) && isset($item["q"]) && isset($item["a"]);
		}));
		if (!is_array($faqs)) {
    			$faqs = [];
		}
		if (array_keys($faqs) !== range(0, count($faqs) - 1)) {
    			$faqs = array_values($faqs);
		}
		// Delete
		if (isset($data["deleteIndex"])) {
        		array_splice($faqs, intval($data["deleteIndex"]), 1);
    		}

		// ADD or EDIT
		else if (isset($data["question"])) {

		   $newFaq = [
            		"q" => trim($data["question"] ?? ""),
            		"a" => trim($data["answer"] ?? "")
        	   ];

        	   if ($newFaq["q"] === "" || $newFaq["a"] === "") {
            		echo json_encode([
                	  "success" => false,
                	  "message" => "Question and answer are required"
            	   ]);
            	   exit();
                }
	        if (isset($data["editIndex"]) && $data["editIndex"] !== null && $data["editIndex"] !== "") {
            		$faqs[intval($data["editIndex"])] = $newFaq;
        	} else {
            		$faqs[] = $newFaq;
		}
	}
		$faqs = array_values($faqs);
		// SAVE JSON

		file_put_contents($faqFile, json_encode($faqs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

		// This was used as the old system 
		$txt = "";
		foreach ($faqs as $faq) {
			$txt .= $faq["q"] . "\n" . $faq["a"] . "\n\n";
		}
		file_put_contents(__DIR__ . "/faq/FAQs.txt", $txt);

		echo json_encode([
			"status" => "ok",
			"success" => true,
			"count" => count($faqs)
		]);
		exit();
 case "repairFAQ":

    $file = __DIR__ . "/faq/faqs.json";

    if (!file_exists($file)) {
        file_put_contents($file, "[]");
    }

    $raw = file_get_contents($file);
    $data = json_decode($raw, true);

    // Convert object -> array safely
    if (!is_array($data)) {
        $data = [];
    }

    // If associative (like "68": {...}), convert to indexed array
    if (array_keys($data) !== range(0, count($data) - 1)) {
        $data = array_values($data);
    }

    // Keep only valid FAQ objects
    $data = array_values(array_filter($data, function ($item) {
        return is_array($item) && isset($item["q"]) && isset($item["a"]);
    }));

    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));

    echo json_encode([
        "success" => true,
        "count" => count($data)
    ]);
    exit();
       // =========================
	// ❌ DEFAULT (NO ACTION)
	// =========================
	default:
		echo json_encode(['success' => false, 'message' => 'Invalid action', 'received_action' => $action ?? 'NOT SET']);
}

	
	
	
	
//Close database connection
$conn->close();

?>
