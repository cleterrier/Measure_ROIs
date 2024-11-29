macro "CrossAlign_Profiles" {
	// Get input table (to be aligned), its title and headings

	inTable = File.openDialog("Choose the input non-aligned table file");
	open(inTable);
	inTitle = Table.title;
	inHeadings = split(Table.headings, "\t");
	
	// Get alignment table, title, size and headings
	alTable = File.openDialog("Now choose the reference aligned table file");
	open(alTable);
	alTitle = Table.title;
	alSize = Table.size;
	alHeadings = split(Table.headings, "\t");
	alColN = alHeadings.length;
	
	// Create output aligned table
	outTitle = replace(inTitle, ".xls", "_CrossAlignments.xls");
	outTitle = replace(outTitle, ".csv", "_CrossAlignments.csv");
	// print(outTitle);
	Table.create(outTitle);

		
	// Loop on alignment table columns
	for (c = 0; c < alColN; c++) {
		
		// intitialize row count for input table
		inr = 0;
		
		// Get alignment table column
		alColumn = Table.getColumn(alHeadings[c], alTitle);
		
		// Loop on alignment table column rows
		for (r = 0; r < alSize; r++) {
		
			// Get value from alignment table column
			currCell = alColumn[r];
			
			// If NaN, set corresponding cell of aligned table to Nan
			if (isNaN(currCell)) {
				Table.set(inHeadings[c], r, NaN, outTitle);
			}
			
			// if first column (can't be NaN), set corresponding cell of aligned table to the alignment table first column value
			else if (c == 0) {
				inValue = Table.get(alHeadings[c], r, alTitle);
				Table.set(alHeadings[c], r, inValue, outTitle);
			}
			
			// if not NaN or first column, set corresponding cell of aligned table to the next value in input table
			else {
					inValue = Table.get(inHeadings[c], inr, inTitle);
					Table.set(inHeadings[c], r, inValue, outTitle);
					inr++;
			}
			
			// Save Table
			outTable = replace(inTable, ".xls", "_CrossAlignments.xls");
			outTable = replace(outTable, ".csv", "_CrossAlignments.csv");
			
			Table.save(outTable);
		
		
		} // end of loops on rows
	} // end of loop on columns
	
	
	Table.update;
}

