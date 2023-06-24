// This macro calculates the average ratio between two group of ROIs of two categories, image by image from a txt/xls/csv file obtained using the "Measure Intensities" macro.
// Mean MI (Mean Intensity) Ratio considers the ratio of (Summed ID divided by Summed Area (or Lenght for line ROIs)) for each category  - treating ROIs of one category like part of one big object.
// Average MI (Mean Intensity) Ratio is the ratio of (Average of mean intensities for each ROI) for each category - treating each ROI as a separate object.
// If background-corrected MIs have been output by the "Measure Intensities" macro, they will be used rather than raw MIs.

macro "Calculate Ratios" {

//	DefCats = newArray("Default", "Axon", "AIS", "Distal Axon", "Dendrite", "Synapse1", "Synapse2", "Axon (NT)", "AIS (NT)", "Distal Axon (NT)", "Dendrite (NT)", "Synapse 1 (NT)", "Synapse 2 (NT)", "Primary", "Secondary", "Tertiary", "Cat0", "Cat1", "Cat2", "Cat3", "Cat4", "Cat5", "Cat6", "Cat7");
// not useful anymore as we can process any category name

	Path = File.openDialog("Choose Results table");
	
	// Define separator depending on format
	if (endsWith(Path, ".csv")) sep = ",";
	else sep = "\t";
	
	// Open results
	Results = File.openAsString(Path);
	RName = File.getNameWithoutExtension(Path);


	// Retrieve the Labels column, the mean intensity column and the area column
	IMAGENAMES = getColumn(Results,"Slice", sep);
	CATS = getColumn(Results,"ROI type", sep);
	TYPES = getColumn(Results,"ROI type#", sep);
	print(IMAGENAMES[0] + "-" + TYPES[0] + "-" + CATS[0]);
	if (IMAGENAMES[0] == -1 || TYPES[0] == -1 || CATS[0] == -1) exit("One of the required column doesn't exist!");
	// Mean intensity used is the background-corrected mean (output by the "Measure Intensities" macro) or if no corrected mean column is found, the raw mean intensity.
	CORRMEAN = getColumn(Results,"Corr Mean", sep);
	if (CORRMEAN[0] == -1) CORRMEAN = getColumn(Results,"Raw Mean", sep);
	if (CORRMEAN[0] == -1) exit ("Mean intensity column doesn't exist!");
	AREA = getColumn(Results, "Area", sep);
	if (AREA[0] == -1) AREA = getColumn(Results, "Area/Length", sep);
	if (AREA[0] == -1) exit ("Area column doesn't exist!");

	// Get an array with each image name and the number of images (defines the per-image arrays length)
	UIM = getUniqueA(IMAGENAMES);
	U = UIM.length;

	// Get an array with each categories and categories numbers
	UCATS = getUniqueA(CATS);
	UTYPES = getUniqueA(TYPES);


	Dialog.create("Calculate Ratios Options");
	Dialog.addChoice("Numerator (N)", UCATS, UCATS[0]);
	Dialog.addChoice("Denominator (D)", UCATS, UCATS[UCATS.length-1]);
	Dialog.show();

	CatNum = Dialog.getChoice();
	CatDen = Dialog.getChoice();

	INum = getIndex(UCATS, CatNum);
	IDen = getIndex(UCATS, CatDen);
	
	TypeNum = UTYPES[INum];
	TypeDen = UTYPES[IDen];

	// Define all per-image arrays
	// Names : name of the image
	// SumType: summed integrated intensities
	// LenType: summed areas
	// MoyType: SumType / LenType, i.e. overall mean intensity for all ROIs pooled
	// MoyType does not depend on the spatial scale as it is present as a multiplicative factor in SumType and LenType
	// Type: summed mean intensities
	// NType: number of ROIs
	// NMoy: Type / NType, i.e. average of mean intensities for each ROI as individual mean intensities
	// NType does not depend on the spatial scale
	// Ratio: ratio of MoyTypes, i.e. ratio of overall mean intensity for all ROIs pooled
	// NRatio: ratio og NMoy, i.e. ratio of averages for each ROI as individual mean intensities

	Names = newArray(U);

	SumTypeA = newArray(U);
	LenTypeA = newArray(U);
	MoyA = newArray(U);
	TypeA = newArray(U);
	NTypeA = newArray(U);
	NMoyA = newArray(U);

	SumTypeB = newArray(U);
	LenTypeB = newArray(U);
	MoyB = newArray(U);
	TypeB = newArray(U);
	NTypeB = newArray(U);
	NMoyB = newArray(U);

	RatioAB = newArray(U);
	NRatioAB = newArray(U);

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
	// Stores values in the first per-image slot if the ROI in the current line is #B
	if (TYPES[0] == TypeDen) {
		LenTypeB[0] = 0 + AREA[0];
		SumTypeB[0] = 0 + CORRMEAN[0] * AREA[0];
		TypeB[0] = 0 + CORRMEAN[0];
		NTypeB[0] = 1;
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
		// Stores values in the current per-image slot if the ROI in the current line is #B
		if (TYPES[j] == TypeDen) {
			LenTypeB[UIndex] = LenTypeB[UIndex] + AREA[j];
			SumTypeB[UIndex] = SumTypeB[UIndex] + CORRMEAN[j] * AREA[j];
			TypeB[UIndex] = TypeB[UIndex] + CORRMEAN[j];
			NTypeB[UIndex] = NTypeB[UIndex] + 1;
		}

	}

	// Loops on all per-image slots
	for (j=0; j<Names.length; j++) {

		// Calculate the overlall MIs and the ratio of overall MI
		if (LenTypeA[j] != 0) MoyA[j] = SumTypeA[j] / LenTypeA[j];
		else MoyA[j] = NaN;
		if (LenTypeB[j] != 0) MoyB[j] = SumTypeB[j] / LenTypeB[j];
		else MoyB[j] = NaN;
		if (LenTypeA[j] != 0 && LenTypeB[j] != 0) RatioAB[j] = MoyA[j] / MoyB[j];
		else RatioAB[j] = NaN;

		// Calculate the average MIs and the ratio of average MIs
		if (NTypeA[j] != 0) NMoyA[j] = TypeA[j] / NTypeA[j];
		else NMoyA[j] = NaN;
		if (NTypeB[j] != 0) NMoyB[j] = TypeB[j] / NTypeB[j];
		else NMoyB[j] = NaN;
		if (NTypeA[j] !=0 && NTypeB[j] !=0) NRatioAB[j] = NMoyA[j] / NMoyB[j];
		else NRatioAB[j] = NaN;

	}

// Generate the Ratios table
	title1 = RName + " (" + TypeNum + "-" + CatNum + "/" + TypeDen + "-" +  CatDen + ") ratios";
	title2 = "[" + title1 + "]";
	f = title2;
	if (isOpen(title1))
		print(f, "\\Clear");
	else
		run("New... ", "name="+title2+" type=Table");
	Headings = "\\Headings:n\tImage\tSummed ID N\tSummed Area N\tOverall MI N\tSummed ID D\tSummed Area D\tOverall MI D\tMean MI Ratio N/D\tSummed MI N\tNumber N\tAverage MI N\tSummed MI D\tNumber D\tAverage MI D\tAverage MI Ratio N/D";
	print(f, Headings);
	for (i = 0; i < Names.length; i++) {
		ResultsLine = d2s(i + 1, 0) + "\t" + Names[i] + "\t" + SumTypeA[i] + "\t" + LenTypeA[i] + "\t" + MoyA[i] + "\t" + SumTypeB[i] + "\t" + LenTypeB[i] + "\t" + MoyB[i] + "\t" + RatioAB[i] + "\t" + TypeA[i] + "\t" + NTypeA[i] + "\t" + NMoyA[i] + "\t"+TypeB[i] + "\t" + NTypeB[i] + "\t" + NMoyB[i] + "\t"+NRatioAB[i];
		print(f, ResultsLine);
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
