<?php
// ====================================
// Error Handling and Environment Setup
// ====================================
//Sets the system to report all PHP errors
error_reporting(E_ALL);
//Disables the display of errors
ini_set('display_errors', 0);
//Logs the errors
ini_set('log_errors', 1);

//Connects to file holding environment variables
//Keeps sensitive information from being easily accessed by general site users
require_once('/home/hue06470/exercisescience/private/config.php');

//Header to mark that the format of data being used is JSON
header('Content-Type: application/json');

// ==========================
// Connection to the Database
// ==========================

//Creates the connection by passing in the related servername, username, and password variables
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

//If statement to test whether or not the connection succeeded
if($conn->connect_error) {
	//System throws an HTTP 500 error
	//HTTP 500 error comes from the server itself
	http_response_code(500);
	//Error message saying that the script failed to connect to the database
	echo json_encode(['error' => 'Database connection failed']);
	//Ends the script
	exit();
}

// ===================================================
// Extracts Information Needed for Individual Bio Page
// ===================================================
//If statement to check if an action can be taken
if(isset($_GET['action']) && $_GET['action'] == 'getAlumniByPennWestId' && isset($_GET['id'])) {
	$requestedId = $_GET['id'];
	$safeId = $conn->real_escape_string($requestedId);
	
	//Requests the PennWest ID, first and last name, start and end date, job title, employer, job setting, bio, and photo of the alumni
	$sql = "SELECT `PennWest ID`, `First Name`, `Last Name`, `Start Date`, `End Date`, `Job Title`, `Employer`, `Job Setting`, `Bio`, `Photo URL` FROM Alumni WHERE `PennWest ID` = '$safeId'";

	//Variable to hold the database connection
	$result = $conn->query($sql);
	
	//If statement to determine the outcome of the connection
	//The connection is successful, and the database returned at least 1 row
	if($result && $result->num_rows > 0) {
		//Variable to store the information of the row
		$row = $result->fetch_assoc();
		//Variable to hold an array of the alumni information
		$alumni = array(
			//Concatenates the column names, and converts the names to a camelcase style
			'pennwestId' => $row['PennWest ID'],
			'name' => $row['First Name'] . ' ' . $row['Last Name'],
			'start' => $row['Start Date'],
			'end' => $row['End Date'],
			'jobTitle' => $row['Job Title'],
			'employer' => $row['Employer'],
			'jobSetting' => $row['Job Setting'],
			'bio' => $row['Bio'],
			'image' => $row['Photo URL']
		);
		//Outputs the alumni information in a JSON format
		echo json_encode($alumni);
	}
	//The connection was unsuccessful, or the database returned 0 rows
	else {
		http_response_code(404);
		echo json_encode([
			'error' => 'Alumni not found',
			'requestedId' => $requestedId
		]);
	}
	
	$conn->close();
	exit;
}


// ============================================
// Get  Most Recent Inductees
// ============================================

if(isset($_GET['action'])
    && $_GET['action'] == 'getRecentInductees') {

    $sql = "SELECT `PennWest ID`, `First Name`, `Last Name`,
                   `Job Title`, `Employer`, `Job Setting`,
                   `Bio`, `Photo URL`
            FROM Alumni
            ORDER BY `Date Added` DESC
            LIMIT 8";

    $result = $conn->query($sql);
    $recentAlumni = [];

    if($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $recentAlumni[] = array(
                'pennwestId' => $row['PennWest ID'],
                'name' => $row['First Name'] . ' ' . $row['Last Name'],
                'jobTitle' => $row['Job Title'],
                'employer' => $row['Employer'],
                'jobSetting' => $row['Job Setting'],
                'bio' => $row['Bio'],
                'image' => $row['Photo URL']
            );
        }
        echo json_encode($recentAlumni);
	$conn->close();
	exit;
	}
}


// Part 2 - Fetching Data from the Database, Converting Data to JSON Format
//////////
//Variable to store the information needed from the Alumni table of the database
//Requests the alumni's first name and last name, job title and setting, employer, bio, and photo URL

if(isset($_GET['action']) && $_GET['action'] == 'getAllAlumni') {
	$sql = "SELECT `PennWest ID`,  `First Name`, `Last Name`, `Job Title`, `Employer`, `Job Setting`, `Bio`, `Photo URL` FROM Alumni";
	//Queries the database, passes in the SQL query, and stores the resulting data
	$result = $conn->query($sql);

	$alumniData = [];

	//If statement to test if any data was retrieved
	if($result && $result->num_rows > 0) {
	//Takes the data from the query and puts it into an array
		while($row = $result->fetch_assoc()) {
			$alumniData[] = array (
				'pennwestId' => $row['PennWest ID'],
				'name' => $row['First Name'] . ' ' . $row['Last Name'],
				'jobTitle' => $row['Job Title'],
				'employer' => $row['Employer'],
				'jobSetting' => $row['Job Setting'],
				'bio' => $row['Bio'],
				'image' => $row['Photo URL']
			);
		}
	}
	//Converts the data into the JSON format for frontend usage
	echo json_encode($alumniData);
	$conn->close();
	exit;
}

// ============================================
// Get Alumni Image Path
// ============================================
if(isset($_GET['action']) && $_GET['action'] == 'getAlumniImagePath' && isset($_GET['name'])) {
	$name = $_GET['name'];
	
	$baseDir = '/Images/Exercise Science Alumni/';
	$basePath = $baseDir . $name;

	$extensions = ['avif', 'webp', 'jpg', 'jpeg', 'png'];

	$foundPath = null;
	$foundExt = null;

	foreach($extensions as $ext) {
		$fullPath = $basePath . '.' . $ext;
		if(file_exists($fullPath)) {
			$foundPath = 'Images/Exercise Science Alumni/' . $name . '.' . $ext;
			$foundExt = $ext;
			break;
		}
	}

	echo json_encode([
		'path' => $foundPath,
		'ext' => $foundExt,
		'name' => $name
	]);

	$conn->close();
	exit;
}


// ============================================
// Invalid action
// ============================================
http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
$conn->close();



