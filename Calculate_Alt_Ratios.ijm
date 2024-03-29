// this macro calculates the ratio  of the mean intensity between alternating ROIs from a csv/txt/xls file obtained using the "Measure Intensities" macro

macro "Calculate Alt Ratios" {

	Path = File.openDialog("Choose Results table");
	
	// Define separator depending on format
	if (endsWith(Path, ".csv")) sep = ",";
	else sep = "\t";
	
	Results = File.openAsString(Path);
	RName = File.getNameWithoutExtension(Path);


	// Retrieve the labels/categories columns and the mean intensity column
	IMAGENAMES = getColumn(Results,"Slice", sep);
	if (IMAGENAMES[0] == -1) exit("One of the required column doesn't exist!");
	// Mean intensity used is the background-corrected mean (output by the "Measure Intensities" macro) or if no corrected mean column is found, the raw mean intensity.
	CORRMEAN = getColumn(Results,"Corr Mean", sep);
	if (CORRMEAN[0] == -1) CORRMEAN = getColumn(Results,"Raw Mean", sep);
	if (CORRMEAN[0] == -1) exit ("Mean intensity column doesn't exist!");

	// Generate the Ratios table
	title1 = RName + " alternating ratios";
	title2 = "[" + title1 + "]";
	f = title2;
	if (isOpen(title1))
		print(f, "\\Clear");
	else
		run("New... ", "name="+title2+" type=Table");
	Headings = "\\Headings:n\tSlice\tROI type#\tROI type\tMean Int 1\tMean Int 2\tRatio 1/2";
	print(f, Headings);
	i = 0;

	for (j = 0; j < IMAGENAMES.length; j = j+2) {
		MEAN_RATIO = parseFloat(CORRMEAN[j]) / parseFloat(CORRMEAN[j+1]);
		ResultsLine = d2s(i + 1, 0) + "\t" + IMAGENAMES[j] + "\t" + TYPES[j] + "\t" + CATS[j] + "\t" + CORRMEAN[j] + "\t" + CORRMEAN[j+1] + "\t" + MEAN_RATIO;
		print(f, ResultsLine);
	}

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