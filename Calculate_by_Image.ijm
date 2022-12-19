// This macro calculates the average mean intensity of all ROIs from each category, image by image from a txt/xls/csv file obtained using the "Measure Intensities" macro.
// Overall MI (Mean Intensity) is the Summed ID divided by the Summed Area (or Lenght for line ROIs) - treating ROIs of one category like part of one big object.
// Average MI (Mean Intensity) is the average of the mean intensities for each ROI - treating each ROI as a separate object.
// If background-corrected MIs have been output by the "Measure Intensities" macro, they will be used rather than raw MIs.

macro "Calculate by Image" {
	
	SplitCond = true;

//	DefCats = newArray("Default", "Axon", "AIS", "Distal Axon", "Dendrite", "Synapse1", "Synapse2", "Axon (NT)", "AIS (NT)", "Distal Axon (NT)", "Dendrite (NT)", "Synapse 1 (NT)", "Synapse 2 (NT)", "Primary", "Secondary", "Tertiary", "Cat0", "Cat1", "Cat2", "Cat3", "Cat4", "Cat5", "Cat6", "Cat7");
// not useful anymore as we can process any category name
	
	Path = File.openDialog("Choose Results table");
	
	// Define separator depending on format
	if (endsWith(Path, ".csv")) sep = ",";
	else sep = "\t";
	
	Results = File.openAsString(Path);
	RName = File.getNameWithoutExtension(Path);

	// Retrieve the Labels column, the mean intenisty column and the area column
	IMAGENAMES = getColumn(Results,"Slice", sep);
	TYPES = getColumn(Results,"ROI type#", sep);
	CATS = getColumn(Results,"ROI type", sep);
	if (IMAGENAMES[0] == -1 || TYPES[0] == -1 || CATS[0] == -1) exit("One of the required column doesn't exist!");
	// Mean intensity used is the background-corrected mean (output by the "Measure Intensities" macro) or if no corrected mean column is found, the raw mean intensity.
	CORRMEAN = getColumn(Results,"Corr Mean", sep);
	if (CORRMEAN[0] == -1) CORRMEAN = getColumn(Results,"Raw Mean", sep);
	if (CORRMEAN[0] == -1) exit ("Mean intensity column doesn't exist!");
	AREA = getColumn(Results, "Area/Length", sep);
	if (AREA[0] == -1) exit ("Area/Length column doesn't exist!");

	// Get an array with each image name and the number of images (defines the per-image arrays length)
	UIM = getUniqueA(IMAGENAMES);
	U = UIM.length;

	// Get an array with each categories and categories numbers
	UCATS = getUniqueA(CATS);
	UTYPES = getUniqueA(TYPES);

//	Array.print(UCATS);
//	Array.print(UTYPES);

	// Generate the Results table
	title1 = RName + " by Image";
	title2 = "[" + title1 + "]";
	f = title2;
	if (isOpen(title1))
		print(f, "\\Clear");
	else
		run("New... ", "name="+title2+" type=Table");
	Headings = "\\Headings:n\tImage\tROI Type #\tRoi Type\tSummed ID\tSummed Area/Length\tOverall MI\tSummed MI\tNumber\tAverage MI";
	print(f, Headings);

	t = 0;


	// loop on all unique categories
	for (c= 0; c < UCATS.length; c++ ) {
			
		CatNum = UCATS[c];
		INum = getIndex(UCATS, CatNum);
		TypeNum = UTYPES[INum];

		Names = newArray(U);	
		SumTypeA = newArray(U);
		LenTypeA = newArray(U);
		MoyA = newArray(U);
		TypeA = newArray(U);
		NTypeA = newArray(U);
		NMoyA = newArray(U);


		// Initialization for i = 0 (first Results Table line)
		Names[0] = IMAGENAMES[0];
		// Stores values in the first per-image slot if the ROI in the current line is #A
		if (TYPES[0] == TypeNum){
			LenTypeA[0] = 0 + AREA[0];
			SumTypeA[0] = 0 + CORRMEAN[0] * AREA[0];
			TypeA[0] = 0 + CORRMEAN[0];
			NTypeA[0] = 1;
			typeflag = 1;
			}
	
		// Loop on all following Results Table lines
		UIndex = 0;
		for (j = 1; j < IMAGENAMES.length; j++) {
			// This detects if it's a new image (new averages) and iterates UIndex to store in the next slot in the per-images array
			if (IMAGENAMES[j] != IMAGENAMES[j - 1]) {
				UIndex = UIndex+1;
				Names[UIndex] = IMAGENAMES[j];
			}
			// Stores values in the current per-image slot if the ROI in the current line is #A
			if (TYPES[j] == TypeNum) {
				LenTypeA[UIndex] = LenTypeA[UIndex] + AREA[j];
				SumTypeA[UIndex] = SumTypeA[UIndex] + CORRMEAN[j] * AREA[j];
				TypeA[UIndex] = TypeA[UIndex] + CORRMEAN[j];
				NTypeA[UIndex] = NTypeA[UIndex] + 1;
			}			
		}
	
		// Loops on all per-image slots
		for (j=0; j<Names.length; j++) {
	
			// Calculate the overlall MIs and the ratio of overall MI
			if (LenTypeA[j] != 0) MoyA[j] = SumTypeA[j] / LenTypeA[j];
			else MoyA[j] = NaN;
	
			// Calculate the average MIs and the ratio of average MIs
			if (NTypeA[j] != 0) NMoyA[j] = TypeA[j] / NTypeA[j];
			else NMoyA[j] = NaN;
		}

		ResultsLine = d2s(t + 1, 0) + "\t" + Names[0] + "\t" + TypeNum + "\t" + CatNum + "\t" + SumTypeA[0] + "\t" + LenTypeA[0] + "\t" + MoyA[0] + "\t" + TypeA[0] + "\t" + NTypeA[0] + "\t" + NMoyA[0];
		print(f, ResultsLine);
		t++;
		
		for (n = 1; n < Names.length; n++) {			
			if (SplitCond == true) {
				prevnameA = split(Names[n-1], "_");
				currnameA = split(Names[n], "_");
				prevC = prevnameA[0];
				currC = currnameA[0];
				if (prevC != currC) {
					print(f, "");
				}
			}
			
			ResultsLine = d2s(t + 1, 0) + "\t" + Names[n] + "\t" + CatNumN + "\t" + CatNum + "\t" + SumTypeA[n] + "\t" + LenTypeA[n] + "\t" + MoyA[n] + "\t" + TypeA[n] + "\t" + NTypeA[n] + "\t" + NMoyA[n];
			print(f, ResultsLine);
			t++;
		}
		print(f, "");
		print(f, "");

	}

// This function returns all values in a Results Table column as an array (or -1 if the Header is not found)
function getColumn(TableString, Header, sepa) {
	Rows = split(TableString, "\n");
	Labels = split(Rows[0], sepa);
	IndexCol = -1;
	for (i = 0; i < Labels.length; i++) {
		if (Labels[i] == Header) {
			IndexCol = i;
		}
	}
	if (IndexCol == -1) return newArray("-1", "0");
	Column = newArray(Rows.length - 1);
	for (i = 1; i < Rows.length; i++) {
		CurrentLine = split(Rows[i], sepa);
		Column[i-1] = CurrentLine[IndexCol];
	}
	return Column;
}


// This function returns an array of unique elements from an unsorted array
function getUniqueA(unsortedArray) {
	
	uniqueArray = newArray(1);
	uniqueArray[0] = unsortedArray[0];
	ui = 1;	
	
	for (ua = 1; ua < unsortedArray.length; ua++) {
		if (unsortedArray[ua] != unsortedArray[ua - 1] && getIndex(uniqueArray, unsortedArray[ua]) < 0) {
			uniqueArray[ui] = unsortedArray[ua];
			ui++;
		}
	}
	return uniqueArray;

}

// This function returns the index of an element in an array
function getIndex(array, el) {
	for (i = 0; i < array.length; i++) {
		if (array[i] == el) return i;
	}
	return -1;
}
