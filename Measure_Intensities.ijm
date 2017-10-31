macro "Measure Intensities" {
	
	stackTitle = getTitle();
	
	// Save current settings and then changes the Measurements settings
	saveSettings();
	run("Set Measurements...", "area mean integrated display redirect=None decimal=1");


	// Dialog for measurements option
	Dialog.create("Measure Intensities Options");
	Dialog.addCheckbox("Reset Spatial Scale", false);
	Dialog.addCheckbox("Subtract Automatic Background", true);
	Dialog.show();
	ResetScale = Dialog.getCheckbox();
	SubtractBgnd = Dialog.getCheckbox();

	// Resets the spatial scale (all distance will be in pixels)
	if (ResetScale == true) {
		run("Set Scale...", "distance=0 known=0 pixel=1 unit=pixel");
	}

	// sets the bin size for histogram measurements
	if (bitDepth() == 8 || bitDepth() == 24) {
		BIN = 256;
	}
	else if (bitDepth() == 16 || bitDepth() == 32) {
		BIN = 65536;
	} 	 
	
	// get the ROI number in the ROI manager
	ROINUMBER = roiManager("count");

	
	title1 = "" + stackTitle + " results";
	title2 = "[" + title1 + "]";
	f = title2;
	if (isOpen(title1))
		print(f, "\\Clear");
	else
	run("New... ", "name=" + title2 + " type=Table");
	Headings = "\\Headings:n\tStack\tSlice#\tSlice\tROI#\tROI\tROI type#\tROI type\tArea\tRaw Mean\tRaw IDt\tStd Dev\tBgrnd\tCorr Mean\tCorr ID";
	print(f, Headings);

	
	// loops on ROIs in the ROI manager
	for (i = 0; i < ROINUMBER; i++) {
		roiManager("select", i);
		imTitle = getInfo("slice.label");
		imNumber = getSliceNumber();
		
		roiTitle = getInfo("selection.name");
		RoiSplit = split(roiTitle, "-");

		if (RoiSplit.length > 3) {
			Roi.setProperty("TracingType", RoiSplit[3]);
			Roi.setProperty("TypeName", RoiSplit[4]);
		}
		
		roiType = Roi.getProperty("TracingType");
		roiTypeName = Roi.getProperty("TypeName");

		roiNumber = i + 1;
		
		getStatistics(roiArea, roiMean, roiMin, roiMax, roiStd, roiHistogram);
		roiID = roiArea * roiMean;


		// Build the Results table line
		ResultsLine = ""+ d2s(i + 1, 0) + "\t" + stackTitle + "\t" + imNumber + "\t" + imTitle + "\t" + roiNumber + "\t" + roiTitle + "\t" + roiType + "\t" + roiTypeName + "\t" + roiArea + "\t" + roiMean + "\t" + roiID + "\t" + roiStd;
		
		// gets the histogram mode (intensity value shared by the most pixels in the histogram) as the backgound intensity value
		if (SubtractBgnd == true) {
			run("Select None");
			getHistogram(VAL, COUNTS, BIN);
			MAXCOUNT = COUNTS[1];
			HISTMODE = 1;
			for (j = 2; j < COUNTS.length - 1; j++) {
				if (COUNTS[j] > MAXCOUNT) {
					MAXCOUNT = COUNTS[j];
					HISTMODE = j;
				}
			}	
			// Logs the Background intensity and the corrected mean intensity values in the Results table	
			Bgnd = HISTMODE;
			corrMean = roiMean - HISTMODE;
			corrID = roiArea * corrMean;
			ResultsLine += "\t" + Bgnd + "\t" + corrMean + "\t" + corrID;
		}
			print(f, ResultsLine);
	}

	// Restores the previous settings
	restoreSettings();
}