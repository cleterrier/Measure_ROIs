macro "Color_ROIs" {
	
	// Store foreground and background colors
	CURRENT_FG = Color.foreground;
	CURRENT_BG= Color.background;

	// Set background color to black
	setBackgroundColor(0, 0, 0);

	// Initialize the color of each ROI type
	CAT_COLORS = newArray("magenta","red","blue","yellow","green","cyan","orange","#551a8b"); // last is purple

	// Set Paste mode to AND
	setPasteMode("AND");

	// Make sure no ROI is selected
	roiManager("Deselect");
	run("Select None");

	// Get ID and Title of input stack
	IN_ID = getImageID();
	IN_TITLE = getTitle();
	IN_SLICES = getSliceNumber();
	
	// Get the ROI number in the ROI manager
	ROINUMBER = roiManager("count");

	// Duplicate stack and convert duplicate to RGB
	run("Duplicate...", "title=RGB duplicate");
	run("RGB Color");
	RGB_ID = getImageID();

	// Loop on ROIs in the ROI manager
	for (i = 0; i < ROINUMBER; i++) {
		
		// Select input stack
		selectImage(IN_ID);
		
		// select ROI
		roiManager("select", i);
		
		// Get slice label and number corresponding to ROI
		SLI_TITLE = getInfo("slice.label");
		SLI_NUM = getSliceNumber();

		/*
		// Re-assign ROI properties from its name beyond the first three digit groups
		ROI_TITLE = Roi.getName;
		ROI_SPLIT = split(ROI_TITLE, "-")	
		if (ROI_SPLIT.length > 3) {
			Roi.setProperty("TracingType", ROI_SPLIT[3]);
			Roi.setProperty("TypeName", ROI_SPLIT[4]);
		}
		*/

		// Get ROI properties: tracing type (number offset by 16) and name (string)
		ROI_TYPE = parseInt(Roi.getProperty("TracingType"));
		ROI_TYPENAME = Roi.getProperty("TypeName");
		ROI_TYPE_OFF = ROI_TYPE - 16;

		// Set foreground to the category color
		Color.setForeground(CAT_COLORS[ROI_TYPE]);

		// Duplicate ROI, convert to RGB, fill ROI with color, copy, close colored ROI duplicate
		run("Duplicate...", "use");
		run("RGB Color");
		run("Fill", "slice");
		run("Copy");
		close();

		// select RGB stack, select ROI, copy-AND colored ROI inside it
		selectImage(RGB_ID);
		roiManager("select", i);
		run("Paste");
		
		// oterate ROI number
		roiNumber = i + 1;
		
		}
	
	// Re-assign initial colors and copy mode
	Color.setForeground(CURRENT_FG);
	Color.setBackground(CURRENT_BG);
	setPasteMode("Copy");
}
		