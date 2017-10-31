// to do : strange color error do not change on some slices
// 19/11/2011 roiManager("Set Color",NewColor); problems with IJ 1.45o, solved in 1.45p7 daily build

macro "Edit_Cat_ROIs" {
	
//	Categories=newArray("0","1","2","3","4","5","6","7");
	Categories = newArray("Default", "Axon", "Dendrite", "Primary", "Secondary", "Tertiary", "Type 06", "Type 07", "Cat0", "Cat1", "Cat2", "Cat3", "Cat4", "Cat5", "Cat6", "Cat7");
	DefaultColors=newArray("magenta","red","blue","red","blue","yellow","red","green", "magenta","red","blue","red","blue","yellow","red","green");
	CatColors=newArray("default", "red","green", "blue","yellow", "magenta", "cyan", "grey", "white", "black");
	
	Dialog.create("Edit categorized ROIs");
	Dialog.addCheckbox("Limit to a Slice Range", false);
	Dialog.addNumber("Start Slice", 1);
	Dialog.addNumber("Stop Slice", nSlices);
	Dialog.addMessage("\n");
	Dialog.addChoice("Category", Categories, Categories[0]);
	Dialog.addCheckbox("Apply to All Categories", false);
	Dialog.addMessage("\n");
	Dialog.addCheckbox("Change Category", false);
	Dialog.addChoice("New Category", Categories, Categories[0]);
	Dialog.addMessage("\n");
	Dialog.addCheckbox("Delete ROIs", false);
	Dialog.addMessage("\n");
	Dialog.addCheckbox("Change Color", false);
	Dialog.addChoice("New Color", CatColors, CatColors[0]);
	Dialog.addMessage("\n");
	Dialog.addCheckbox("Change Width", false);
	Dialog.addNumber("New Width", 2,0,2,"");
	Dialog.show()
	SliceRange=Dialog.getCheckbox();
	StartSlice=Dialog.getNumber();
	StopSlice=Dialog.getNumber();	
	Cat=Dialog.getChoice();
	AllCat=Dialog.getCheckbox();
	ChangeCat=Dialog.getCheckbox();
	NewCat=Dialog.getChoice();
	DeleteROI=Dialog.getCheckbox();
	ChangeColor=Dialog.getCheckbox();
	NewColor=Dialog.getChoice();
	ChangeWidth=Dialog.getCheckbox();
	NewWidth=Dialog.getNumber();	


	if (SliceRange == false) {
		StartSlice = 1;
		StopSlice = nSlices;
	}
	
	for (i=0; i<roiManager("count"); i++) {	
		roiManager("select", i);
		Name = getInfo("selection.name");
		RoiSplit = split(Name, "-");
		if (RoiSplit.length < 4) {
			Name = Name + "-" + 0 + "-Default";
			RoiSplit = split(Name, "-");
		}
		CurrentSliceString = RoiSplit[0];
		CurrentSlice = parseInt(CurrentSliceString);
		if (CurrentSlice >= StartSlice && CurrentSlice <= StopSlice) {
			CatType = RoiSplit[3];
			CatName = RoiSplit[4];
			if (CatName == Cat || AllCat == true) {
				if (ChangeCat == true) {
					NewCatN = getIndex(Categories, NewCat);
					NewName = replace(Name, CatType + "-" + CatName, NewCatN + "-" + NewCat);
					Roi.setProperty("TracingType", NewCatN);
					Roi.setProperty("TypeName", NewCat);
					roiManager("Rename", NewName);
					roiManager("Set Color", DefaultColors[NewCatN]);
				}
				if (DeleteROI==true) {
					roiManager("Delete");
					i--;
				}
				if (ChangeColor == true) {
					if (NewColor == "default") {
						ColorIndex = getIndex(Categories, CatName);
						NewColor = DefaultColors[ColorIndex];
					}
					roiManager("Set Color",NewColor);
				}
				if (ChangeWidth==true) {
					roiManager("Set Line Width", NewWidth);
				}
				
			}
		}	
	}
}


function getIndex(array, el) {
	for (i = 0; i < array.length; i++) {
		if (array[i] == el) return i;
	}
	return -1;
}
