macro "Calculate Ratios" {	
	
	DefCats = newArray("Default", "Axon", "Dendrite", "Primary", "Secondary", "Tertiary", "Type 06", "Type 07");
	
	Path = File.openDialog("Choose Results table");	
	Results = File.openAsString(Path);

	// Retrieve the Labels column, the mean intenisty column and the area column
	IMAGENAMES = getColumn(Results,"Slice");
	TYPES = getColumn(Results,"ROI type#");
	CATS = getColumn(Results,"ROI type");
	if (IMAGENAMES[0] == -1 || TYPES[0] == -1 || CATS[0] == -1) exit("One of the required column doesn't exist!");
	// Mean intensity used is the background-corrected mean (output by the "Measure Intensities" macro) or if no corrected mean column is found, the raw mean intensity.
	CORRMEAN = getColumn(Results,"Corr Mean");
	if (CORRMEAN[0] == -1) CORRMEAN = getColumn(Results,"Raw Mean");
	if (CORRMEAN[0] == -1) exit ("Mean intensity column doesn't exist!");
	AREA = getColumn(Results, "Area");
	if (AREA[0] == -1) exit ("Area column doesn't exist!");
	
	// gets the number of images (defines the per-image arrays length)	
	U=getUnique(IMAGENAMES);
	
	
	UT = getUnique(CATS);
	UCATS = newArray(UT);
	UCATS[0] = CATS[0];
	u = 0;
	for (i = 1; i < CATS.length; i++) {
		if (CATS[i] != CATS[i-1]) {
			u++;
			UCATS[u] = CATS[i];
		}
	}

	Dialog.create("Calculate Ratios Options");
	Dialog.addChoice("Numerator (N)", UCATS, UCATS[0]);
	Dialog.addChoice("Denominator (D)", UCATS, UCATS[UCATS.length-1]);
	Dialog.show();
	
	CatNum = Dialog.getChoice();
	CatDen = Dialog.getChoice();

	CatNumN = getIndex(DefCats, CatNum);
	CatDenN = getIndex(DefCats, CatDen);
	
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
	if (TYPES[0] == CatNumN){
		LenTypeA[0] = 0 + AREA[0];
		SumTypeA[0] = 0 + CORRMEAN[0] * AREA[0];
		TypeA[0] = 0 + CORRMEAN[0];
		NTypeA[0] = 1;
		typeflag = 1;
		}
	// Stores values in the first per-image slot if the ROI in the current line is #B
	if (TYPES[0] == CatDenN) {
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
		if (TYPES[j] == CatNumN) {
			LenTypeA[UIndex] = LenTypeA[UIndex] + AREA[j];
			SumTypeA[UIndex] = SumTypeA[UIndex] + CORRMEAN[j] * AREA[j];
			TypeA[UIndex] = TypeA[UIndex] + CORRMEAN[j];
			NTypeA[UIndex] = NTypeA[UIndex] + 1;
		}
		// Stores values in the current per-image slot if the ROI in the current line is #B
		if (TYPES[j] == CatDenN) {
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
	title1 = "(" + CatNum + "/" + CatDen + ") Ratios";
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
function getColumn(TableString, Header) {
	Rows = split(TableString, "\n");
	Labels = split(Rows[0], "\t");
	IndexCol = -1;
	for (i = 0; i < Labels.length; i++) {
		if (Labels[i] == Header) {
			IndexCol = i;
		}
	}
	if (IndexCol == -1) return -1;
	Column = newArray(Rows.length - 1);
	for (i = 1; i < Rows.length; i++) {
		CurrentLine = split(Rows[i], "\t");
		Column[i-1] = CurrentLine[IndexCol];
	}
	return Column;
}


// This function returns the number of unique elements in a sorted array
function getUnique(SortedArray) {
	Array.sort(SortedArray);
	DiffNumber = 1;
	for (i = 1; i < SortedArray.length; i++) {
		if (SortedArray[i] != SortedArray[i - 1]) {
			DiffNumber = DiffNumber + 1;
		}
	}
	return DiffNumber;
}

function getIndex(array, el) {
	for (i = 0; i < array.length; i++) {
		if (array[i] == el) return i;
	}
	return -1;
}

