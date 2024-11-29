// Convert_ndf_to_ROI macro by Christophe Leterrier
// 20-01-2015
//
// From a folder with 8-bit images and corresponding .ndf files (containing tracing coordinates as output by the NeuronJ plugin),
// generates ROIs from each tracing, and stores them in the ROI Manager. Output ROI line width is adjustable.
// Keeps tracings color and type according to the ndf file (tracing type stored in ROI name and ROI properties).
// Warning: does not save the ROI set on disk in the end (only in the ROI manager).
// For multichannel tracings (different tracings on different  channels in the input folder), can output either
// - an hyperstack with tracings on their respective channels
// - a stack of the first channel containing tracings from different channels flattened (single channel output option)
//   This allows to measure intensities on channels others than the ones used to draw tracings,
//   by applying ROIs on different single-channels stacks from the same acquisition.


macro "Convert_ndf_to_ROI" {

	// Default parameter values
	lineWidth_def = 1; // width (in pixels) of the line ROIs
	chNumber_def = 1; // number of channels in the input folder
	singCh_def = false; // single channel option (applies only if more than one channel)
	keepCh_def = 1; // in case of single channel output, which channel to keep (1-n)

	// Colors as defined in the NeuronJ plugin
	neuronJColors = newArray("black", "blue", "cyan", "green", "magenta", "orange", "pink", "red", "yellow");

	// macro parameters (when called as "runMacro(macro, arg)")
	params = getArgument();

	if (params == "")
	{
		// Retrieve the images from the NeuronJ image folder
		inDir = getDirectory("Select a directory");
		print("\n\n\n*** Convert ndf to ROI log ***");
		print("Input directory:" + inDir);

		//Creation of the dialog box
		Dialog.create("ndf to ROI Options");
		Dialog.addNumber("Line width", lineWidth_def, 0, 2, "pixels" ); // width (in pixels) of the line ROIs
		Dialog.addMessage("");
		Dialog.addNumber("Channel number", chNumber_def, 0, 2, "channels" ); // number of channels in the input folder
		Dialog.addCheckbox("Single channel output", singCh_def); // single channel option (applies only if more than one channel)
		Dialog.addNumber("   Keep channel #", keepCh_def, 0, 2, "" ); // in case of single channel output, which channel to keep (1-n)
		Dialog.show();

		// Feeding variables from dialog choices
		lineWidth = Dialog.getNumber();
		chNumber = Dialog.getNumber();
		singCh = Dialog.getCheckbox();
		keepCh = Dialog.getNumber();
	}
	else
	{
		// if not provided,  assign default values
		inDir = "";
		lineWidth = lineWidth_def;
		chNumber = chNumber_def;
		singCh = singCh_def;
		keepCh = keepCh_def;

		// extract arguments
		macro_args = split(params);
		for (ik = 0; ik < macro_args.length; ik++)
		{
			if (startsWith(macro_args[ik],"dir="))
				inDir = substring(macro_args[ik], 4);
			else if (startsWith(macro_args[ik],"line="))
				lineWidth = parseInt(substring(macro_args[ik], 5));
			else if (startsWith(macro_args[ik],"channel="))
				chNumber = parseInt(substring(macro_args[ik], 8));
			else if (startsWith(macro_args[ik],"single"))
				singCh = true;
			else if (startsWith(macro_args[ik],"keep="))
				keepCh = parseInt(substring(macro_args[ik], 5));
			else
				print("Unknown argument!");
		}

		if ("inDir" == "" || !File.exists(inDir) || !File.isDirectory(inDir))
			exit("Could not find directory!");

		if (!endsWith(inDir,"\\"))
			inDir = inDir+"\\";

	}
	inParent = File.getParent(inDir);
	inName = File.getName(inDir);

	// Clear ROI manager
	roiManager("reset");

	// Open all images in the folder
	run("Image Sequence...", "open=[" + inDir + "] sort");

	// Get slice number, and number of slice after channels split
	allSlice = nSlices();
	sliceNumber = allSlice / chNumber;

	// Verify that images in folder can be split into channels
	if (sliceNumber != floor(sliceNumber))
		exit("Image number not multiple of channel number in the folder");

	// Make an hyperstack with slices and channels
	if (allSlice > 1)
		run("Stack to Hyperstack...", "order=xyczt(default) channels=" + chNumber + " slices=" + sliceNumber + " frames=1 display=Grayscale");

	// Loop over all slices in the hyperstack, retrieve the ndf files and create the ROI
	for (i=0; i < allSlice; i++) {

		// Set slice and get HS position
		setSlice(i + 1);
		Stack.getPosition(currCh, currSlice, currFrame);

		// Get .ndf file name
		if (allSlice == 1)
			ndfName = Property.getSliceLabel; // strange bug in single-image case, there is .ndf already in the name
		else {
			imageName = Property.getSliceLabel;
			ndfName = replace(imageName, ".tif", ".ndf");
		}

		// Log
		print("  image #" + (i + 1));
		print("  ndf file: " + ndfName);

		if (File.exists(inDir + ndfName) == 1) {

			ndfFile = File.openAsString(inDir + ndfName);
			// uses the function "wordsplit" to break the file into Tracings
			ndfParts = wordsplit(ndfFile, "// Tracing");

			// Log
			//for( i = 0; i < ndfParts.length; i++) print("ndfParts[" + i + "]=" + Parts[i]);

			nTracings = ndfParts.length - 1;
			logString = "  contains " + nTracings + " tracings";

			// Get types and colors
			ndfHeader = wordsplit(ndfParts[0], "//");
			ndfTypes = split(ndfHeader[3], "\n");

			typeLength = (ndfTypes.length - 1) / 2;
			typeNames = newArray(typeLength);
			typeAdd = newArray(typeLength);
			typeColors = newArray(typeLength);

			for (a = 1; a < ndfTypes.length; a = a + 2){
				// print("a=" + a + " " + ndfTypes[a] + "-" + ndfTypes[a+1])
				typeNames[(a - 1) / 2] = ndfTypes[a];
				nColor = parseInt(ndfTypes[a + 1]);
				typeColors[(a - 1) / 2] = neuronJColors[nColor];
			}

			// Loop (over tracings) retrieves the coordinates and creates the ROI
			for (k = 1; k < nTracings + 1 ; k++) {

				// Split coordinates
				coorList = split(ndfParts[k], "\n");

				// Tracing type
				tracType = parseInt(coorList[2]);
				// print("tracType = " + tracType);

				// Get number a valid coordinates
				listLength = 0;
				for (j = 6; j < coorList.length; j++) {
					if (startsWith(coorList[j], "// Segment") == false && startsWith(coorList[j], "// End") == false) {
						listLength++;
					}
				}
				// print("listLength =" + listLength);

				// Build the array of valid coordinates
				cleanCoor = newArray(listLength);
				c = 0;
				for (j = 6; j < coorList.length; j++) {
					if (startsWith(coorList[j], "// Segment") == false && startsWith(coorList[j], "// End") == false) {
						cleanCoor[c] = coorList[j];
						c++;
					}
				}

				// Split in X and Y arrays
				lineX = newArray(listLength / 2);
				lineY = newArray(listLength / 2);

				for (j = 0; j < listLength; j = j + 2) {
						lineX[j / 2] = cleanCoor[j];
						lineY[j / 2] = cleanCoor[j+1];
				}

				logString = logString + ", N" + (k + 1) + " (l" + lineX.length + ")";

				// Create the ROI from coordinates
				makeSelection("polyline", lineX, lineY);

				// Allow to smooth the tracing
				run("Fit Spline");

				// Put ROI only on first channel if single channel output option is checked
				if (chNumber > 1 && singCh == true)
					Stack.setPosition(1, currSlice, currFrame);

				// Set ROI properties
				Roi.setProperty("TracingType", tracType);
				Roi.setProperty("TypeName", typeNames[tracType]);

				// Add ROI to the ROI manager
				roiManager("Add");

				// Rename the ROI to add the type of tracing
				roiManager("Select",roiManager("count") - 1);
				roiName = getInfo("selection.name");
				roiName = roiName + "-" + tracType + "-" + typeNames[tracType];
				roiManager("Rename", roiName);

				// Change the ROI color according to type and the ROI line width
				roiManager("Select",roiManager("count") - 1);
				roiManager("Set Color", typeColors[tracType]);
				roiManager("Set Line Width", lineWidth);

			}

		print(logString);
		}
		//Log if no ndf file for a slice
		else print("  no tracing (no .ndf file)");
	}

	if (chNumber > 1 && singCh == true) {
		setSlice(keepCh);
		run("Reduce Dimensionality...", "slices");
		for (r = 0; r < roiManager("count"); r++) {
			roiManager("Select", r);
			roiName = getInfo("selection.name");
			roiPos = split(roiName, "-");
			roiSlice = parseInt(roiPos[0]);
			newSlice = floor(roiSlice / chNumber) + 1;
			setSlice(newSlice);
			roiManager("Update");
			nameSlice = IJ.pad(newSlice, 4);
			newName = replace(roiName, roiPos[0], nameSlice);
			roiManager("Rename", newName);
		}

	}


	// reset slice and ROI display
	roiManager("Deselect");
	setSlice(1);
	// Presents all the ROIs created
	roiManager("Associate", "true");
	roiManager("Show All");
	roiManager("Show All with labels");
	// roiManager("Save", inPar + File.separator + inName + "_ROIs.zip");
	print("*** Convert ndf to ROI end ***");
	showStatus("Convert ndf to ROI finished");

}

// Function is similar to the "split" built-in function but with a "word" splitter (a series of characters interpreted as a whole)
function wordsplit(StartString, DeliString) {
	ShrinkString=StartString;
	nParts=0;
	DelIndex=0;
	while (DelIndex>-1) {
		DelIndex=indexOf(ShrinkString,DeliString);
		ShrinkString=substring(ShrinkString, DelIndex+lengthOf(DeliString));
		nParts++;
	}
	SplitString=newArray(nParts);
	ShrinkString=StartString;
	for (j=0; j<nParts-1; j++) {
		DelIndex=indexOf(ShrinkString,DeliString);
		SplitString[j]=substring(ShrinkString, 0, DelIndex);
		ShrinkString=substring(ShrinkString, DelIndex+lengthOf(DeliString));
	}
	SplitString[nParts-1]=ShrinkString;
	return SplitString;
}
