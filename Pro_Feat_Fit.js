// ProFeatFit script by Christophe Leterrier
// Profiles, Feature detection (begin/max/end), Curve fitting of the profile, Alignment of profiles
// 14-06-19 Adapted to new Fiji with call to classes

importClass(Packages.java.awt.Color);
importClass(Packages.ij.gui.Overlay);
importClass(Packages.java.awt.Polygon);
importClass(Packages.java.lang.Double);

importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);
importClass(Packages.ij.plugin.frame.RoiManager);
importClass(Packages.ij.plugin.Duplicator);
importClass(Packages.ij.gui.ProfilePlot);
importClass(Packages.java.lang.Double);
importClass(Packages.ij.measure.CurveFitter);
importClass(Packages.ij.gui.Plot);
importClass(Packages.ij.process.ByteProcessor);
importClass(Packages.ij.gui.Roi);
importClass(Packages.ij.process.ImageProcessor);
importClass(Packages.ij.plugin.filter.ThresholdToSelection);
importClass(Packages.ij.gui.PointRoi);
importClass(Packages.ij.ImageStack);
importClass(Packages.ij.ImagePlus);
importClass(Packages.ij.measure.ResultsTable);
importClass(Packages.ij.gui.PolygonRoi);


IJ.log("\n*****************************************************\nProFeatFit has started!\n*****************************************************");


//**************************
// Input Variables (SR)
//**************************

var ChooseTypeD = false; // Process specific categories?
var TypeNameD = "Axon"; // Name of categories to process

var ProfileWidthD = 50; // total width of the line trace for profile, 5 for AIS
var HalfWidthD = 0; // sliding window smoothing along the profile, 0 for no smoothing, usually 10
var ScalePlotsD = true; // present each plot scaled in Y?

var getFeatureD = false; // compute feature (with threshold-based begin/max/end)?
var beginThresholdD = 0.30; // threshold for begin, 0.30 for AIS
var endThresholdD = 0.30; // threshold for end, 0.30 for AIS
var FeatureTypeArray = new Array("small", "large");
var FeatureTypeD = "small"; // choose "small" or "large" relative to threshold (small = first time under from max, large = first time above from extremities)

var getFitD = true; // compute a fit of the profile?
var FitYSourceArray = new Array("PRawProfile", "PSmoothProfile"); // "PNormProfile", "PRawNormProfile" not supported yet (plotting problem)
var FitYSourceD = "PRawProfile" // which profile to fit: PRawProfile, PSmoothProfile, PNormProfile, PRawNormProfile
var FitEquationArray = new Array("GAUSSIAN_NOOFFSET", "GAUSSIAN", "GAMMA_VARIATE");
var FitEquationD = "GAUSSIAN"; // type of fit: GAUSSIAN_NOOFFSET, GAUSSIAN, GAMMA_VARIATE etc.

var getAlignmentD = true; // compute aligned profiles?
// var alignFitsD = true; // add fit curves to the alignments? needs some more work
var AlignOnArray = new Array("start", "begin", "max", "fitmax", "end");
var AlignOnD = "fitmax"; // choose to align on "start", "begin", "max", "fitmax", "end"


//**************************
// Output Variables (SR)
//**************************

var logProfilesD = true; // detailled log of the Profiles, Features and Fits?
var generateFeatureROID = false; // generates feature as ROI in the Roi Manager?
var outTypeNameD = "PFF"; // category of output ROIs
var displayOverD = false; // display overlays
var displayPlotsD = true; // display the plots stack
var displayResultsTableD = true; // output Results Table?
var displayProfilesTableD = true; // output Profiles Table?
var displayAlignedTableD = true; // output Aligned Profiles Tables?
var ProfileTypeArray = new Array("RawProfile", "SmoothProfile", "NormProfile", "RawNormProfile");
var ProfileTypeD = "RawProfile"; // choose type of profile to align: raw, smoothened, smoothened normalized, raw normalized
var SubBackgroundD = false;

/*
//**************************
// Input Variables (AIS)
//**************************

var ChooseTypeD = false; // Process specific categories?
var TypeNameD = "Axon"; // Name of categories to process
var ProfileWidthD = 5; // total width of the line trace for profile, 5 for AIS
var HalfWidthD = 5; // sliding window smoothing along the profile, 0 for no smoothing, usually 10
var ScalePlotsD = true; // present each plot scaled in Y?

//var getFeatureD = true; // compute feature (with threshold-based begin/max/end)?
var getFeatureD = false;
var beginThresholdD = 0.35; // threshold for begin, 0.35 for AIS
var endThresholdD = 0.35; // threshold for end, 0.35 for AIS
var FeatureTypeArray = new Array("small", "large");
var FeatureTypeD = "large"; // choose "small" or "large" relative to threshold (small = first time under from max, large = first time above from extremities)
							// large for AIS
var getFitD = false; // compute a fit of the profile?
var FitYSourceArray = new Array("PRawProfile", "PSmoothProfile"); // "PNormProfile", "PRawNormProfile" not supported yet
var FitYSourceD = "PSmoothProfile" // which profile to fit: PRawProfile, PSmoothProfile, PNormProfile, PRawNormProfile
var FitEquationArray = new Array("GAUSSIAN_NOOFFSET", "GAUSSIAN", "GAMMA_VARIATE");
var FitEquationD = "GAUSSIAN_NOOFFSET"; // type of fit: GAUSSIAN_NOOFFSET, GAUSSIAN, GAMMA_VARIATE etc.

//var getAlignmentD = true; // compute aligned profiles?
var getAlignmentD = false;
var AlignOnArray = new Array("start", "begin", "max", "fitmax", "end");
var AlignOnD = "begin"; // choose to align on "start", "begin", "max", "fitmax", "end"


//**************************
// Output Variables (AIS)
//**************************

var logProfilesD = true; // detailled log of the Profiles, Features and Fits?
var generateFeatureROID = false; // generates feature as ROI in the Roi Manager?
var outTypeNameD = "PFF"; // category of output ROIs 
var displayOverD = false; // display overlays
var displayPlotsD = true; // display the plots stack
var displayResultsTableD = true; // output Results Table?
var displayProfilesTableD = true; // output Profiles Table?
var displayAlignedTableD = false; // output Aligned Profiles Tables?
var ProfileTypeArray = new Array("RawProfile", "SmoothProfile", "NormProfile", "RawNormProfile");
var ProfileTypeD = "NormProfile"; // choose type of profile to align: raw, smoothened, smoothened normalized, raw normalized
var SubBackgroundD = true;
*/


//**************************
// Variables not in dialog
//**************************

var plotSizeX = 800; // width in px of the output plot
var plotSizeY = 512; // height in px of the output plot
var boxWidth = 10; // margin in px for the crop (unused yet)
var letters = new Array("a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l");

//**************************
// Dialog
//**************************

var gd = new GenericDialog("ProFeatFit Options");

gd.addCheckbox("Process Category", ChooseTypeD);
gd.addStringField("Category Name", TypeNameD, 10);

gd.addMessage("");
gd.addNumericField("Profile width", ProfileWidthD, 0, 5, "px");
gd.addNumericField("Window half-width", HalfWidthD, 0, 5, "px");
gd.addCheckbox("Scale Plots", ScalePlotsD);

gd.addMessage("");
gd.addCheckbox("Process begin/max/end", getFeatureD);
gd.addNumericField("Begin threshold", beginThresholdD, 2, 5, "");
gd.addNumericField("End threshold", endThresholdD, 2, 5, "");
gd.addChoice("Type of detection", FeatureTypeArray, FeatureTypeD);
 
gd.addMessage("");
gd.addCheckbox("Fit profile", getFitD);
gd.addChoice("Source profile for fit", FitYSourceArray, FitYSourceD);
gd.addChoice("Fit equation", FitEquationArray, FitEquationD);

gd.addMessage("");
gd.addCheckbox("Make alignment", getAlignmentD);
// gd.addCheckbox("Align Fits", alignFitsD); needs more work
gd.addChoice("Align on", AlignOnArray, AlignOnD);

gd.addMessage("Output parameters");
gd.addCheckbox("Log profiles", logProfilesD);
gd.addCheckbox("Generate ROIs", generateFeatureROID);
gd.addStringField("Add to Category Name", outTypeNameD, 10);
gd.addCheckbox("Display overlays", displayOverD);
gd.addCheckbox("Display plots stack", displayPlotsD);
gd.addCheckbox("Display results table", displayResultsTableD);
gd.addCheckbox("Display profiles table", displayProfilesTableD);
gd.addCheckbox("Display aligned table", displayAlignedTableD);
gd.addChoice("Profile Type", ProfileTypeArray, ProfileTypeD);
gd.addCheckbox("Background-corrected profiles", SubBackgroundD);

gd.showDialog();

var ChooseType = gd.getNextBoolean();
var TypeName = gd.getNextString();

var ProfileWidth = gd.getNextNumber();
var HalfWidth = gd.getNextNumber();
var ScalePlots = gd.getNextBoolean();

var getFeature = gd.getNextBoolean();
var beginThreshold = gd.getNextNumber();
var endThreshold = gd.getNextNumber();
var FeatureType = gd.getNextChoice(); 

var getFit = gd.getNextBoolean();
var FitYSource = gd.getNextChoice(); 
var FitEquation = gd.getNextChoice(); 

var getAlignment = gd.getNextBoolean();
// var alignFits = gd.getNextBoolean(); needs more work
var AlignOn = gd.getNextChoice(); 

var logProfiles = gd.getNextBoolean();
var generateFeatureROI = gd.getNextBoolean();
var outTypeName = gd.getNextString();
var displayOver = gd.getNextBoolean();
var displayPlots = gd.getNextBoolean();
var displayResultsTable = gd.getNextBoolean();
var displayProfilesTable = gd.getNextBoolean();
var displayAlignedTable = gd.getNextBoolean();
var ProfileType = gd.getNextChoice();
var SubBackground = gd.getNextBoolean();

if (gd.wasOKed()) {

	//**************************
	// Get names, IDs, number of slices, scale, number of ROIs
	//**************************
	
	var imp = IJ.getImage();
	var StackName = imp.getTitle();
	var StackID = imp.getID();
	var StackDim = imp.getDimensions();
	var Scale = getScale(imp);
	var PxSize = Scale[0];
	var PxUnit = Scale[1];
	var rm = RoiManager.getInstance();
	var ra = rm.getRoisAsArray();
	var nroi = rm.getCount();
	
	//**************************
	// for each roi: detect category
	//**************************
	
	if (ChooseType == true) {
		var ri = 0;
		var tArray = new Array();
		for (var r=0; r<nroi; r++) {
			var currRoi = rm.getRoi(r);
			var currType = currRoi.getProperty("TracingType");
			var currTName = currRoi.getProperty("TypeName");
			if (currTName == TypeName || currTName == null) {
				tArray[ri] =  r;
				ri++;
			}
		}
	}
	else {
		var tArray = new Array();
		for (var r=0; r<nroi; r++) {
			tArray[r] = r;
		}
	}
	
	nr = tArray.length;
	
	// define the Profiles array
	var AllProfiles = new Array(nr);
	var AllFeatures = new Array(nr);
	var AllFits = new Array(nr);
	var AllAligns = new Array(nr);
	
	//**************************
	// for each roi: define Profile parameters, add it to the Profile array
	//**************************
	
	for (var ar=0; ar<nr; ar++) {
	
		r = tArray[ar];
		
		var Profile = new profile();
		var Feature = new feature();
		var Fit = new fit();
		var Align = new align();
		
		Profile.PStackName = StackName;
		Profile.PStackID = StackID;
		
		Profile.PPxSize = PxSize;
		Profile.PPxUnit = PxUnit;
	
		Profile.PRoiName = rm.getName(r);
		Profile.PRoiIndex = r;
		
		var RoiType = getRoiType(imp, rm, r);
		Profile.PRoiLabel = RoiType[0];
		Profile.PRoiType = RoiType[1];
		Profile.PRoiColor = RoiType[2]
		Profile.PRoiWidth = ProfileWidth;
		
		var Slice = getSlice(imp, rm, r);
		Profile.PSliceName = Slice[0];
		Profile.PSliceNumber = Slice[1];
	
		if (SubBackground == true) Profile.PBackground = getBackground(imp, rm, r);	
		Profile.PWidth = StackDim[0];
		Profile.PHeight = StackDim[1];
		
		Profile.PSourceROI = getROI(imp, rm, r);
	
		Profile.PScaledLength = getScaledLength(imp, rm, r);
		Profile.PRawProfile = getProfile(imp, rm, ra, r, ProfileWidth);
		Profile.PRawLength = Profile.PRawProfile.length;
		Profile.PLineCoor = getLineCoor(Profile.PRawLength, Profile.PPxSize);
	
		var XYFullCoor = getFullCoordinates(imp,rm, r, Profile.PRawLength);
		var XYCoor = getCoordinates(imp,rm, r);
		Profile.PXCoor = XYCoor[0];
		Profile.PYCoor = XYCoor[1];
	
		
		
		Profile.PRawMin = getMin(Profile.PRawProfile);
		Profile.PRawMax = getMax(Profile.PRawProfile);
	
		Profile.PRawMeanInt = getMeanIntensity(Profile.PRawProfile);
		Profile.PRawIntDens = getRawIntegratedDensity(Profile.PRawProfile);
	
		Profile.PHalfWidth = HalfWidth;
		Profile.PSmoothProfile = getSmoothProfile(Profile.PRawProfile, Profile.PHalfWidth);
		Profile.PSmoothMin = getMin(Profile.PSmoothProfile);
		Profile.PSmoothMax = getMax(Profile.PSmoothProfile);
		Profile.PSmoothMaxIndex = getMaxIndex(Profile.PSmoothProfile);
		Profile.PSmoothMaxIndexScaled = Profile.PLineCoor[Profile.PSmoothMaxIndex];
	
		Profile.PNormProfile = getNormalizedProfile(Profile.PSmoothProfile, Profile.PSmoothMin, Profile.PSmoothMax);
		Profile.PRawNormProfile = getNormalizedProfile(Profile.PRawProfile, Profile.PSmoothMin, Profile.PSmoothMax);
	
		Profile.PRawNormMin = getMin(Profile.PRawNormProfile);
		Profile.PRawNormMax = getMax(Profile.PRawNormProfile);
	
		Profile.PHasFeature = false; 
		Profile.PHasFits = false;
		Profile.hasAlignment = false;
	
	
	// Compute Features on the Profile	
		if (getFeature == true) {
	
			Profile.PHasFeature = true;
	
			Feature.FProfileIndex = r;
			
			var FBegin = getFBegin(Profile, beginThreshold);
			if (FeatureType == "small") {
				Feature.FBeginIndex = FBegin[0];
				Feature.FScaledBegin = FBegin[1];
			}
			else if (FeatureType == "large") {
				Feature.FBeginIndex = FBegin[2];
				Feature.FScaledBegin = FBegin[3];
			}
			
			var FEnd = getFEnd(Profile, endThreshold);
			if (FeatureType == "small") {
				Feature.FEndIndex = FEnd[0];
				Feature.FScaledEnd = FEnd[1];
			}
			else if (FeatureType == "large") {
				Feature.FEndIndex = FEnd[2];
				Feature.FScaledEnd = FEnd[3];
			}
	
			Feature.FRawLength = Feature.FEndIndex - Feature.FBeginIndex;
			if (isNaN(Feature.FRawLength) == true) {
				Profile.PHasFeature = false;
			}
			Feature.FScaledLength = Feature.FScaledEnd - Feature.FScaledBegin;
			
			Feature.FMeanInt = getMeanSub(Profile.PRawProfile, Feature.FBeginIndex, Feature.FEndIndex);
			Feature.FMiCor = Feature.FMeanInt - Profile.PBackground;
	
			Feature.FxCoor = getSub(Profile.PXCoor, Feature.FBeginIndex, Feature.FEndIndex);
			Feature.FyCoor = getSub(Profile.PYCoor, Feature.FBeginIndex, Feature.FEndIndex);
	
		}
	
	
	// Compute Fit of the Profile
		if (getFit == true) {
			Profile.PHasFits = true;
	
			Fit.TProfileIndex = r;
	
			Fit.TEqType = FitEquation;
			Fit.TFit = doProfileFit(Profile, FitYSource, FitEquation);
			Fit.TFitX = Fit.TFit.getXPoints();
			Fit.TFitY = Fit.TFit.getYPoints();
			Fit.TParameters = Fit.TFit.getParams();
			Fit.TRSquared = Fit.TFit.getRSquared();
			Fit.TCurve = new Array(Fit.TFitX.length);
			for (var i = 0; i < Fit.TFitX.length; i++) Fit.TCurve[i] = Fit.TFit.f(Fit.TParameters, Fit.TFitX[i]);
			Fit.TCurveMax = getMax(Fit.TCurve);
			Fit.TCurveMaxIndex = getMaxIndex(Fit.TCurve);
			Fit.TCurveMin = getMin(Fit.TCurve);
			Fit.TNormCurve = getNormalizedProfile(Fit.TCurve, Fit.TCurveMin, Fit.TCurveMax);
	
		}
	
		AllProfiles[ar] = Profile;
		AllFeatures[ar] = Feature;
		AllFits[ar] = Fit;
		AllAligns[ar] = Align;
	
		if (logProfiles == true) {
			var ProfileLog = printProfile(Profile, Feature, Fit);
			IJ.log(ProfileLog);
		}
	}
	
	//*************************************************************************************
	// Compute Alignment of Profiles
	//*************************************************************************************
	
	
	if (getAlignment == true) {
	
		MasterLength = getAllValues("PRawLength", AllProfiles);
		
		if (AlignOn == "start") {
			var MasterPos = new Array (AllProfiles.length);
			for (var i = 0; i < AllProfiles.length; i++) MasterPos[i] = 0;
		}
		else if (AlignOn == "begin") {
			var MasterPos = getAllValues("FBeginIndex", AllFeatures);
		}
		else if (AlignOn == "max") {
			var MasterPos = getAllValues("PSmoothMaxIndex", AllProfiles);
		}
		else if (AlignOn == "fitmax") {
			var MasterPos = getAllValues("TCurveMaxIndex", AllFits); 
		}
		else if (AlignOn == "end") {
			var MasterPos = getAllValues("FEndIndex", AllFeatures);
		}
		
		var MaxShiftLeft = getMax(MasterPos);
		var MaxShiftRight = getMaxDiff(MasterLength, MasterPos);
		var AlignLength = MaxShiftLeft + MaxShiftRight;
		
		var AlignX = getLineCoor(AlignLength, 1);
	 
		for (var r = 0; r < AllProfiles.length; r++) {
			
			var Profile = AllProfiles[r];
			var Feature = AllFeatures[r];
			var Fit = AllFits[r];
			var Align = AllAligns[r];		
	
			Align.AProfileIndex = r;
			Align.AMasterPos = MasterPos[r];
			
			if (isNaN(Align.AMasterPos) == false) {
							
				Profile.PHasAlignment = true;
		
				Align.AShiftLeft = MaxShiftLeft - MasterPos[r];
				Align.AShiftRight = MaxShiftRight - (Profile.PRawLength - MasterPos[r]);
						
				Align.AXScaled = getLineShiftCoor(AlignLength, Profile.PPxSize, MaxShiftLeft);
				Align.ARawProfile = getAlignY(Align.AShiftLeft, Align.AShiftRight, Profile.PRawProfile);
				Align.ASmoothProfile = getAlignY(Align.AShiftLeft, Align.AShiftRight, Profile.PSmoothProfile);
				Align.ANormProfile = getAlignY(Align.AShiftLeft, Align.AShiftRight, Profile.PNormProfile);
				Align.ARawNormProfile = getAlignY(Align.AShiftLeft, Align.AShiftRight, Profile.PRawNormProfile);
				
				if (Profile.hasFits == true) {		
					Align.ACurve = getAlignY(Align.AShiftLeft, Align.AShiftRight, Fit.TCurve);
					Align.ANormCurve = getAlignY(Align.AShiftLeft, Align.AShiftRight, Fit.TNormCurve);
				}
					
				AllProfiles[r] = Profile;
				AllAligns[r] = Align;
			}
	
			else {
				Profile.PHasAlignment = false;
				AllProfiles[r] = Profile;
			}		
		
		if (logProfiles == true) {
			var AlignLog = printAlign(Profile, Feature, Fit, Align);
			IJ.log(AlignLog);
		}
		
		}			
	}
	
	
	
	//**************************
	// Output part
	//**************************
	
	
	var outName = StackName.replace(".tif", "") + "_PFF(w" + ProfileWidth + ",h" + HalfWidth; 
	if (getFeature == true) outName += ",b" + beginThreshold + ",e" + endThreshold + "," + FeatureType;
	if (getAlignment == true) outName += ",a" + AlignOn;
	outName += ")";
	
	
	//*************************************************************************************
	// Output 1: Generate Feature ROI
	//*************************************************************************************
	
	// For each Profile, if options are valid, generate the Feature ROI
	
	if (generateFeatureROI == true) {
		
		for (var r = 0; r < AllProfiles.length; r++) {
		
			var Profile = AllProfiles[r];
			var Feature = AllFeatures[r];
			
			// Generate the feature roi
			
			if (Profile.PHasFeature == true) {
				
				var Froi = new PolygonRoi(convertArrayF(Feature.FxCoor), convertArrayF(Feature.FyCoor), Feature.FxCoor.length, Roi.POLYLINE);
				imp.setSlice(Profile.PSliceNumber);
	
				Froi.setProperty("TracingType", Profile.PRoiLabel);
				Froi.setProperty("TypeName", Profile.PRoiType + "_" + outTypeName);
				Froi.setStrokeColor(Profile.PRoiColor);
				Froi.setStrokeWidth(Profile.PRoiWidth);			
	
				rm.addRoi(Froi);
				
				// Delete source ROI
				var sourceIndex = Profile.PRoiIndex;
				rm.select(sourceIndex - r);
				rm.runCommand("Delete");
									
				// Rename output ROI
				rm.select(rm.getCount()-1);
				var sourceName = Profile.PRoiName;
				var sourceParts = sourceName.split("-");
				var destName = sourceParts[0] + "-" + sourceParts[1] + "-" + sourceParts[2] + "-" + Profile.PRoiLabel + "-" + Profile.PRoiType + "_" + outTypeName;
				rm.runCommand("Rename", destName);			
				var rmrois = rm.getSelectedRoisAsArray();
				Froi = rmrois[0];

				// Store feature ROI
				Feature.FRoi = Froi;
	
			}
			 
			else {
				// Select source ROI
				var sourceIndex = Profile.PRoiIndex;
				rm.select(sourceIndex - r);
				var rmrois = rm.getSelectedRoisAsArray();
							
				Froi = rmrois[0];
				Froi.setProperty("TracingType", Profile.PRoiLabel);
				Froi.setProperty("TypeName", Profile.PRoiType + "_" + outTypeName);
				Froi.setStrokeColor(Profile.PRoiColor);
				Froi.setStrokeWidth(Profile.PRoiWidth);
				
				rm.addRoi(Froi);

				// Delete source ROI
				var sourceIndex = Profile.PRoiIndex;
				rm.select(sourceIndex - r);
				rm.runCommand("Delete");

				// Rename with "noFeat" to indicate failure to find full Feature
				rm.select(rm.getCount()-1);
				var sourceName = Profile.PRoiName;
				var sourceParts = sourceName.split("-");
				var destName = sourceParts[0] + "-" + sourceParts[1] + "-" + sourceParts[2] + "-" + Profile.PRoiLabel + "-" + Profile.PRoiType + "_" + "noFeat";
				rm.runCommand("Rename", destName);			
	
			}
		}	
		rm.runCommand("Sort");
	}
	
	//*************************************************************************************
	// Output 2: Plots of Profile, Feature & Fit
	//*************************************************************************************
	
	if (displayPlots == true) {	
		var AllProfilePlots = new Array(nroi);
		var plotStacks = new ImageStack(plotSizeX, plotSizeY);
		
		// Looks for max and min of all plots to unify plot scale accross all features
		var plotMaxX = getMaxValue("PScaledLength", AllProfiles);
		var plotMinY = getMinValue("PRawMin", AllProfiles);
		var plotMaxY = getMaxValue("PRawMax", AllProfiles);
		
		// Log the plots limits
		// IJ.log("plotMaxX=" + plotMaxX + ", plotMinY=" + plotMinY + ", plotMaxY=" + plotMaxY);
		
		// For each Profile, generate the profile plot, and add a slice to the Profiles image stack
		for (var r = 0; r < AllProfiles.length; r++) {	
		
			var Profile = AllProfiles[r];
			var Feature = AllFeatures[r];
			var Fit = AllFits[r];
		
			// generate the profile plot: add the profile and the feature points, get the ip	
			if (ScalePlots == true) plotMaxY = Profile.PRawMax * 1.1;
			else plotMaxY = plotMaxY * 1.2;
			var prfPlot = new Plot("Profiles", Profile.PPxUnit, "intensity", convertArrayD(Profile.PLineCoor), Profile.PRawProfile);
			prfPlot.setSize(plotSizeX, plotSizeY);
			prfPlot.setLimits(0, plotMaxX, plotMinY, plotMaxY);
			prfPlot = addProfilePlot(Profile, prfPlot);
			if (getFeature == true) prfPlot = addFPlot(Profile, Feature, prfPlot)
			if (getFit == true) prfPlot = addFitPlot(Profile, Feature, Fit, prfPlot);
			prfPlot.draw;
			AllProfilePlots[r] = prfPlot;
			var PlotP = prfPlot.getProcessor();
			plotStacks.addSlice(Profile.PSliceName.replace(",","-") + " " + Profile.PRoiName, PlotP);
		}
	
		// i+ from the Profiles image stack
		var plotImp = new ImagePlus(outName + "_Plots", plotStacks);
		// show the plots
		plotImp.show();
			
	}
	
	//*************************************************************************************
	// Output 3: Overlay of features
	//*************************************************************************************
	
	if (displayOver == true) {
		// Initialize the overlay
		var over = new Overlay();	
	
		// For each Profile, generate the profile plot, and add a slice to the Profiles image stack
		for (var r = 0; r < AllProfiles.length; r++) {	
		
			var Profile = AllProfiles[r];
			var Feature = AllFeatures[r];
			var Fit = AllFits[r];
			// IJ.log(Profile.PRoiName);
			// generate the overlay: snake around the line trace and feature points
			over = addOutlineToOverlay(Profile, over, ProfileWidth, "stack");
			if (getFeature == true) over = addFToOverlay(Profile, Feature, over, "stack");
		}
		imp.setOverlay(over);	
	}
	
	
	//*************************************************************************************
	// Output 4: Results Tables
	//*************************************************************************************
	
	if (displayResultsTable == true) {
		// Initialize the Results Table
		var rt = new ResultsTable();
		var row = -1;
		
		for (var r = 0; r < AllProfiles.length; r++) {
	
			var Profile = AllProfiles[r];
			var Feature = AllFeatures[r];
			var Fit = AllFits[r];
			
			//log to Results Table
			rt.incrementCounter();
			row++;
		
			var fullName = Profile.PStackName + " " + Profile.PRoiName+ " " + Profile.PSliceName;
			
			rt.setValue("Stack", row, Profile.PStackName);
			rt.setValue("Slice #", row, "" + Profile.PSliceNumber);
			rt.setValue("Slice", row, Profile.PSliceName);
			rt.setValue("Roi #", row, "" + Profile.PRoiIndex);
			rt.setValue("Roi", row, Profile.PRoiName);
			rt.setValue("Length", row, Profile.PRawLength);
			rt.setValue("Max", row, Profile.PRawMax);
			
			if (getFeature == true) {
				rt.setValue("F Begin", row, Feature.FScaledBegin);
				rt.setValue("F Max", row, Profile.PSmoothMaxIndexScaled);
				rt.setValue("F End", row, Feature.FScaledEnd);
				rt.setValue("F length", row, Feature.FScaledLength);
			
			if (getFit == true) {
				for (var i = 0; i < Fit.TParameters.length; i++) {
					rt.setValue("Fit " + letters[i], row, Fit.TParameters[i]);
				}
				rt.setValue("Fit R2", row, Fit.TRSquared);
				}
			}
			
			// show the Results Table
			rt.show(outName + "_Results");
		}
	}
		
	
	//*************************************************************************************
	// Output 5: Profile Tables
	//*************************************************************************************
	
	if (displayProfilesTable == true) {
		// Initialize the Profiles Table
		var pt = new ResultsTable();
		var maxRawLength = getMaxValue("PRawLength", AllProfiles);
		
		var Profile = AllProfiles[0];
		var scaleX = Profile.PPxSize;
		for (var p = 0; p < maxRawLength; p++) {	
			pt.setValue("Scaled X", p, p * scaleX);
		}
		
		for (var r = 0; r < AllProfiles.length; r++) {
	
			var Profile = AllProfiles[r];
			var Feature = AllFeatures[r];
			var Fit = AllFits[r];
			
			for (p = 0; p < Profile.PNormProfile.length; p++) {
				var stringValue = "Profile.P" + ProfileType + "[p]"; // uses ProfileType to choose which profile to output
				var pValue = eval(stringValue);
				if (SubBackground == true) {
					if (ProfileType == "RawProfile" || ProfileType == "SmoothProfile") pValue = pValue - Profile.PBackground;			
				}
				pt.setValue(Profile.PSliceName.replace(",","-") + " " + Profile.PRoiName, p, pValue);
			}
			for (p = Profile.PNormProfile.length; p < maxRawLength; p++) {
				pt.setValue(Profile.PSliceName.replace(",","-") + " " + Profile.PRoiName, p, Number.NaN);
			}
		}
		// show the Profiles Table
		pt.show(outName + "_" + ProfileType + "s");
	
	}
	
	
	//*************************************************************************************
	// Output 6: Alignment Tables
	//*************************************************************************************
	
	if (getAlignment == true && displayAlignedTable == true) {
		// Initialize the Alignment Table
		var at = new ResultsTable();
	
		// make a column with scaled X
		makeAlignXScaled(AllAligns, at);
	
		// make a column with each alignment (type chosen by ProfileType, background-subtracted as an option)
		for (var r = 0; r < AllAligns.length; r++) {
			var Profile = AllProfiles[r];	
			if (Profile.PHasAlignment == true) {
				var Align = AllAligns[r];
				for (var p = 0; p < AlignLength; p++) {
					var stringValue = "Align.A" + ProfileType + "[p]";
					var pValue = eval(stringValue);
					if (SubBackground == true) {
						if (ProfileType == "RawProfile" || ProfileType == "SmoothProfile") pValue = pValue - Profile.PBackground;			
					}			
					at.setValue(Profile.PSliceName.replace(",","-") + " " + Profile.PRoiName, p, pValue);
				}		
			}
			else {
				for (var p = 0; p < AlignLength; p++) {
					at.setValue(Profile.PSliceName.replace(",","-") + " " + Profile.PRoiName, p, Double.NaN);
				}			
			}
		}
		// show the Alignment Table
		at.show(outName + "_" + ProfileType + "s_Alignments");
	}
}

//*************************************************************************************
// End
//*************************************************************************************

IJ.log("\n*****************************************************\nProFeatFit has finished!\n*****************************************************");



//*************************************************************************************
// Utilities funtions
//*************************************************************************************

// Utility to convert a javascript array into a java double array
function convertArrayD(arr) {
	var jArr = java.lang.reflect.Array.newInstance(java.lang.Double.TYPE, arr.length);
	for (var i = 0; i < arr.length; i++) {
   		jArr[i] = arr[i];
 	}
  	return jArr;
}


// Utility to convert a javascript array into a java float array
function convertArrayF(arr) {
	var jArr = java.lang.reflect.Array.newInstance(java.lang.Float.TYPE, arr.length);
	for (var i = 0; i < arr.length; i++) {
   		jArr[i] = arr[i];
 	}
  	return jArr;
}

//*************************************************************************************
// Utility to log Profile parameters
//*************************************************************************************

function printProfile(Profile, Feature, Fit) {
	var logstring = "\n*** Profile data ***\n";
	logstring += "Stack Name: " + Profile.PStackName + "\n";
	logstring += "Stack ID: " + Profile.PStackID + "\n";
	logstring += "Stack Pixel Size: " + Profile.PPxSize + " " + Profile.PPxUnit + "\n";
	logstring += "Roi Name: " + Profile.PRoiName + "\n";
	logstring += "Roi Index: " + Profile.PRoiIndex + "\n";
	logstring += "Roi Label: " + Profile.PRoiLabel + "\n";
	logstring += "Roi Type: " + Profile.PRoiType + "\n";
	logstring += "Roi Color: " + Profile.PRoiColor + "\n";
	logstring += "Slice Name: " + Profile.PSliceName + "\n";
	logstring += "Slice Number: " + Profile.PSliceNumber + "\n";
	logstring += "Image background: " + Profile.PBackground + "\n";
	logstring += "xCoor: " + printArraySample(Profile.PXCoor) + "\n";
	logstring += "yCoor: " + printArraySample(Profile.PYCoor) + "\n";
	logstring += "Scaled Length: " + Profile.PScaledLength + " "+ Profile.PPxUnit+"\n";
	logstring += "Raw Length: " + Profile.PRawLength + " pixels\n";
	logstring += "Raw Profile: " + printArraySample(Profile.PRawProfile) + "\n";
	logstring += "Line Coordinates: " + printArraySample(Profile.PLineCoor) + "\n";
	logstring += "Raw Min: " + Profile.PRawMin + "\n";
	logstring += "Raw Max: " + Profile.PRawMax + "\n";
	logstring += "Raw Mean Intensity: " + Profile.PRawMeanInt + "\n";
	logstring += "Raw Integrated Density: " + Profile.PRawIntDens + "\n";
	logstring += "Sliding Window Half-Width: " + Profile.PHalfWidth + "\n";
	logstring += "Smoothened Profile: " + printArraySample(Profile.PSmoothProfile) + "\n";
	logstring += "Smooth Min: " + Profile.PSmoothMin + "\n";
	logstring += "Smooth Max: " + Profile.PSmoothMax + "\n";
	logstring += "Smooth Max Index: " + Profile.PSmoothMaxIndex + "\n";
	logstring += "Scaled Smooth Max: " + Profile.PSmoothMaxIndexScaled + "\n";
	logstring += "Normalized Profile: " + printArraySample(Profile.PNormProfile) + "\n";
	logstring += "Raw Normalized Profile: " + printArraySample(Profile.PRawNormProfile) + "\n";
	logstring += "Raw Norm Min: " + Profile.PRawNormMin + "\n";
	logstring += "Raw Norm Max: " + Profile.PRawNormMax + "\n";
	
	logstring += "\nhas Features: " + Profile.PHasFeature + "\n";

if (Profile.PHasFeature == true) {
		logstring += "Feature Begin Index: " + Feature.FBeginIndex + "\n";
		logstring += "Feature Scaled Begin: " + Feature.FScaledBegin + "\n";
		logstring += "Feature End Index: " + Feature.FEndIndex + "\n";
		logstring += "Feature Scaled End: " + Feature.FScaledEnd + "\n";
		logstring += "Feature Raw Length: " + Feature.FRawLength + "\n";
		logstring += "Feature Scaled Length: " + Feature.FScaledLength + "\n";
		logstring += "Feature Mean Intensity: " + Feature.FMeanInt + "\n";
		logstring += "Feature Corrected Mean Intensity: " + Feature.FMiCor + "\n";
//		logstring += "Feature xCoor: " + printArraySample(Feature.FxCoor) + "\n";
//		logstring += "Feature yCoor: " + printArraySample(Feature.FyCoor) + "\n";
	}

	logstring += "\nhas Fits: " + Profile.PHasFits + "\n";
if (Profile.PHasFits == true) {
		logstring += "Fit Equation: " + FitEquation + "\n"; 
		for (var i = 0; i < Fit.TParameters.length; i++) {
			logstring += "Fit_" + letters[i] + ": " + Fit.TParameters[i] + "\n";
		}
		logstring += "Fit R2: " + Fit.TRSquared + "\n";
	}
	
	return logstring;
}

//*************************************************************************************
// Utility to log Alignment parameters
//*************************************************************************************
function printAlign(Profile, Feature, Fit, Align) {
	
	var logstring = "\n*** Alignment data ***\n";
	logstring += "Stack Name: " + Profile.PStackName + "\n";
	logstring += "Slice Number: " + Profile.PSliceNumber + "\n";
	logstring += "Slice Name: " + Profile.PSliceName + "\n";
	logstring += "Roi Name: " + Profile.PRoiName + "\n";
	logstring += "Has Alignment: " + Profile.PHasAlignment + "\n";
	logstring += "Aligned on: " + AlignOn + " at " + Align.AMasterPos + " pixels \n";

	return logstring;
}


//*************************************************************************************
// Utility to print a few elements from an array + its length: takes an array, returns a string
//*************************************************************************************
function printArraySample(Array) {
	if (Array.length < 2) return "*too small*";
	var string = "[ " + Array[0] + ", " + Array[1] + ", ... , " + Array[Array.length-2] + ", " + Array[Array.length-1] + " ] (length "+ Array.length + ")";	
	return string;
}
//*************************************************************************************
// Utility to print all elements of an array: takes an array, returns a string
//*************************************************************************************
function printArrayFull(Array) {
	var string = "[ ";
	for (var i = 0; i < Array.length-1; i++) {
		string += Array[i] + "\n";
	}
	string += Array[Array.length-1] + " ]";
	return string;
}


//*************************************************************************************
// Function that generate Profile parameters
//*************************************************************************************

//*************************************************************************************
// get the scale of the image: takes an i+, returns an array with (size of a pixel, unit)
//*************************************************************************************
function getScale(imp){
	var cal=imp.getCalibration();
	var scale=cal.getX(1);
	var unit=cal.getXUnit()+"s";
	return [scale , unit];
}
//*************************************************************************************
// takes roimanager, index, returns the label of the ROI as an integer (second to last number from NDF to ROI macro)
//*************************************************************************************
function getRoiType(imp, rm, r){
	rm.select(imp, r);
	var roi = imp.getRoi();
	var rti = roi.getProperty("TracingType");
	var rtn = roi.getProperty("TypeName");
	var rtc = roi.getStrokeColor();
	return [rti, rtn, rtc];
}

//*************************************************************************************
// takes i+, roimanager, index, returns an array (slice label, slice number) for a given ROI
//*************************************************************************************
function getSlice(imp, rm, r) {
	if (imp.getImageStackSize() > 1) {	
		var snumber = rm.getSliceNumber(rm.getName(r));
		var stk = imp.getImageStack();
		var sname = stk.getSliceLabel(snumber);	
	}
	else {
		var snumber = 1;
		var sname = imp.getTitle();
	}
	return [sname , snumber];
}
//*************************************************************************************
// takes i+, roimanager, index, returns the corresponding ROI
//*************************************************************************************
function getROI(imp, rm, r){
	rm.select(imp, r);
	var roi = imp.getRoi();
	return roi;
}

//*************************************************************************************
// takes i+, roimanager, index, returns the scaled length of the ROI
//*************************************************************************************
function getScaledLength(imp, rm, r){
	rm.select(imp, r);
	var roi = imp.getRoi();
	var length = roi.getLength();
		
	return length;
}


//*************************************************************************************
// takes i+, roimanager, index, returns the profile along the ROI with a w width (array)
//*************************************************************************************
function getProfile(imp, rm, ra, r, w){

	// gets the roi to have the initial stroke width	
	var roi = ra[r];
	var roiT = roi.getTypeAsString();
	if (roiT == "Straight Line") { 
		var iw = roi.getStrokeWidth();
		roi.setStrokeWidth(w);
		roi.setImage(imp);
		var prf = roi.getPixels();
		roi.setStrokeWidth(iw);
		}
	else {
		var iw = roi.getStrokeWidth();
		rm.select(imp, r);
		rm.runCommand("Set Line Width", w);
		var profPlot = new ProfilePlot(imp);
		var prf = profPlot.getProfile();
		rm.runCommand("Set Line Width", iw);
		}
	return prf;
}

//*************************************************************************************
// takes array, returns min of the array
//*************************************************************************************
function getMin(prf){
	var min = 1000000000;
	for (var i = 0; i <prf.length; i++) {
		if (prf[i] < min) min = prf[i];
	}
	return min;
}
//*************************************************************************************
// takes array, returns max of the array
//*************************************************************************************
function getMax(prf){
	var max = 0;
	for (var i = 0; i <prf.length; i++) {
		if (prf[i] > max) max = prf[i];
	}
	return max;
}
//*************************************************************************************
// takes two arrays, returns max of the difference between values along the arrays
//*************************************************************************************
function getMaxDiff(a1, a2){
	var maxdif = 0;
	for (var i = 0; i < a1.length; i++) {
		var dif = a1[i] - a2[i];
		if (dif > maxdif) maxdif = dif;
	}
	return maxdif;
}
//*************************************************************************************
// generate scaled x coordinates along the line ROI
//*************************************************************************************
function getLineCoor(length, scale){
	var lc = new Array(length);
	var m = 0;
	for (var i = 0; i < length; i++) {
		lc[i]= i * scale;
	}
	return lc;
}
//*************************************************************************************
// returns mean of an array
//*************************************************************************************
function getMeanIntensity(prf){
	var id = 0;
	var l = 0;
	for (var i = 0; i < prf.length; i++) {
		l++;	
		id += prf[i];
	}
	var mei = id / l;
	return mei;
}

//*************************************************************************************
// returns the index of the max value of an array
//*************************************************************************************
function getMaxIndex(prf) {
	var max = 0;
	var mi = 0;
	for (var i = 0; i <prf.length; i++) {
		if (prf[i] > max) {
			max = prf[i];
			mi = i;	
		}
	}
	return mi;
}
//*************************************************************************************
// returns the sum of an array
//*************************************************************************************
function getRawIntegratedDensity(prf){
	var id = 0;
	for (var i = 0; i < prf.length; i++) {
		id += prf[i];
	}
	return id;
}	
//*************************************************************************************
// returns a smoothened array with window half-width of h
//*************************************************************************************
function getSmoothProfile(prf, h) {
	if (h==0) return prf;
	var avrg = new Array(prf.length);
	for (var i = 0; i < prf.length; i++ ) {
		avrg[i] = 0;
		var n = 0;
		for (var j = Math.max(0, i-h); j < Math.min(prf.length, i+h); j++) {
			avrg[i] += prf[j];
			n++;
		}
		avrg[i] /= n;
	}
	return avrg;
}
//*************************************************************************************
// returns an array normalized by min and max (to 0 and 1)
//*************************************************************************************
function getNormalizedProfile(prf, min, max) {
	var norm = new Array(prf.length);
	for (var i = 0; i < prf.length; i++) {
		norm[i] = (prf[i] - min) / (max - min);
	}
	return norm;
}
//*************************************************************************************
// takes an i+, roimanager, index and returns an array of two arrays : x and y coordinates (no interpolation)
//*************************************************************************************
function getCoordinates(imp, rm, r) {
	rm.select(imp, r);
	var roi = imp.getRoi();
	var rpoly = roi.getInterpolatedPolygon();
	var xPoints = rpoly.xpoints;
	var yPoints = rpoly.ypoints;
	var xCoor = new Array(xPoints.length);
	var yCoor = new Array(yPoints.length);
	for (var i = 0; i < xPoints.length; i++) {
		xCoor[i] = xPoints[i];
		yCoor[i] = yPoints[i];
	}
	return [xCoor, yCoor];
}
//*************************************************************************************
// takes an i+, roimanager, index and returns an array of two arrays : x and y coordinates with 1-px interpolation
//*************************************************************************************
function getFullCoordinates(imp, rm, r, length) {
	rm.select(imp, r);
	var roi = imp.getRoi();
	if (roi.getType() != 5) roi.fitSplineForStraightening();
	var xPoints = roi.getFloatPolygon().xpoints;
	var yPoints = roi.getFloatPolygon().ypoints;
	var xCoor = new Array(xPoints.length);
	var yCoor = new Array(yPoints.length);
	for (var i = 5; i < xPoints.length; i++) {
		xCoor[i] = xPoints[i];
		yCoor[i] = yPoints[i];
	}
	return [xCoor, yCoor];
}

//*************************************************************************************
// takes an i+ and returns the mode of the histogram as background
//*************************************************************************************
function getBackground(imp, rm, r) {
	rm.select(imp, r);
	var impro = imp.getProcessor();
	var histo = impro.getHistogram();
	var max = histo[1];
	var mindex = 1;
	for (var i = 2; i < histo.length - 1; i++) {
		if (histo[i] > max) {
			max = histo[i];
			mindex = i;	
		}
	}
	return mindex;
}

//*************************************************************************************
// Functions for detection of feature begin, end and mean intensities
// return both indexes and scaled feature positions
//*************************************************************************************

//*************************************************************************************
// Feature begin : first (small) and last (large) point backward from max with next point below threshold
//*************************************************************************************
function getFBegin(Profile, t) {
	var begin = new Array(Number.NaN, Number.NaN, Number.NaN, Number.NaN);
	var cross = 0;
	for (var c = Profile.PSmoothMaxIndex - 1; c > 0; c--) {
		if (Profile.PNormProfile[c] - t <= 0 && Profile.PNormProfile[c + 1] - t >= 0) {
			cross ++;
			if (cross == 1) {
				begin[0] = c + 1;
				begin[1] = Profile.PLineCoor[c + 1];
			}
			begin[2] = c + 1;
			begin[3] = Profile.PLineCoor[c + 1];
			
		}
		
	}
	return begin;
}
//*************************************************************************************
// Feature end : first (small) and last (large) point forward from max with next point below threshold
//*************************************************************************************
function getFEnd(Profile, t) {
	var end = new Array(Number.NaN, Number.NaN, Number.NaN, Number.NaN);
	var cross = 0;
	for (var c = Profile.PSmoothMaxIndex + 1; c < Profile.PNormProfile.length; c++) {
		if (Profile.PNormProfile[c] - t <= 0 && Profile.PNormProfile[c - 1] - t >= 0) {
			cross ++;
			if (cross == 1) {
				end[0] = c - 1 ;
				end[1] = Profile.PLineCoor[c - 1];
			}
			end[2] = c - 1;
			end[3] = Profile.PLineCoor[c - 1];
			
		}
		
	}
	return end;
}
//*************************************************************************************
// subArray mean : returns the mean of a subset from an array (from start s to end e)
//*************************************************************************************
function getMeanSub(a, s, e) {
	if (Double.isNaN(s) == true || Double.isNaN(e) == true) return Number.NaN;
	var sub = new Array(e + 1 - s);
	for (var i = 0; i < e + 1 - s ; i++){
		sub[i] = a[s+i];
	}
	var meansub = getMeanIntensity(sub);
	return meansub;
}
//*************************************************************************************
// subArray: returns the subset from an array (from start s to end e)
//*************************************************************************************
function getSub(a, s, e) {
	if (Double.isNaN(s) == true || Double.isNaN(e) == true) return Number.NaN;
	var sub = new Array(e + 1 - s);
	for (var i = 0; i < e + 1 - s ; i++){
		sub[i] = a[s+i];
	}
	return sub;
}


//*************************************************************************************
// Functions for fitting
//*************************************************************************************

//*************************************************************************************
// Perform the fit of the profile using the chosen equation, returns a CurveFitter object
//*************************************************************************************
function doProfileFit(Prof, yString, eqString) {
	prfX = Prof.PLineCoor;
	prfYString = "prfY = Prof." + yString;
	eval(prfYString);
	fitter = new CurveFitter(prfX, prfY);
	doFitString = "fitter.doFit(CurveFitter." + eqString + ")";
	eval(doFitString);
	return fitter;
}


//*************************************************************************************
// Functions that operate on the Profiles array (all Profiles)
//*************************************************************************************

//*************************************************************************************
// takes the Profile arrays and returns all values for a given parameter as an array
//*************************************************************************************
function getAllValues(field, Profileset) {
	var fa = new Array(Profileset.length);
	for (var i = 0; i < fa.length; i++) {
		string = "fa[i] = Profileset[i]." + field;
		eval(string);
	}
	return fa;
}

//*************************************************************************************
// takes the Profile arrays and returns the min value for a given parameter across all Profiles
//*************************************************************************************
function getMinValue(field, Profileset) {
	var fa = getAllValues(field, Profileset);
	var min = fa[0];
	for (var i = 0; i < fa.length; i++) {
		if (fa[i] < min) min = fa[i];
	}
	return min;
}

//*************************************************************************************
// takes the Profile arrays and returns the max value for a given parameter across all Profiles
//*************************************************************************************
function getMaxValue(field, Profileset) {
	var fa = getAllValues(field, Profileset);
	var max = fa[0];
	for (var i = 0; i < fa.length; i++) {
		if (fa[i] > max) max = fa[i];
	}
	return max;
}


//*************************************************************************************
// Functions that are used in the alignment
//*************************************************************************************

//*************************************************************************************
// generate scaled x coordinates along the line ROI with 0 at Master position
//*************************************************************************************
function getLineShiftCoor(length, scale, pos){
	var lc = new Array(length);
	var m = 0;
	for (var i = 0; i < length; i++) {
		lc[i]= (i - pos) * scale;
	}
	return lc;
}

//*************************************************************************************
// Generates an aligned array padded with NaN
//*************************************************************************************
function getAlignY(nleft, nright, prf){
	var aa = new Array(nleft + prf.length + nright); 
	if (isNaN(nleft) == true) {
		for (var i = 0; i < nleft + prf.length + nright; i++) {
			aa[i] = Number.NaN;
		}
	}
	else {
		for (var i = 0; i < nleft; i++) {
			aa[i] = Number.NaN;
		}
		for (var i = 0; i < prf.length; i++) {
			aa[nleft + i] = prf[i];
		}
		for (var i = 0; i < nright; i++) {
			aa[nleft + prf.length + i] = Number.NaN;
		}
	}
	return aa;
}

//*************************************************************************************
// Makes the X scaled column in the Alignment tables from the first non-NAN alignment
//*************************************************************************************
function makeAlignXScaled(Alignments, table){
	for (var r = 0; r < Alignments.length; r++) {
		var al = Alignments[r];
		if (isNaN(al.AMasterPos) == false) {
			for (var p = 0; p < al.ARawNormProfile.length; p++) {
				table.setValue("Scaled X", p, al.AXScaled[p]);
			}
			return table;
		}
	}
	return;
}
	

//*************************************************************************************
// Functions that generate the overlay
//*************************************************************************************

//*************************************************************************************
//  takes an Profile and overlay, returns an updated overlay with the line ROI of the Profile (not currently used)
//*************************************************************************************
function addROIToOverlay(Profile, overlay, color, width) {
	var roi = Profile.PSourceROI;
	roi.setPosition(Profile.PSliceNumber);
	roi.setStrokeColor(color);
  	roi.setStrokeWidth(width);
	overlay.add(roi);
	return overlay;
}
//*************************************************************************************
// takes an Profile and overlay, returns an updated overlay with the line ROI of an Profile as a "snake"
//*************************************************************************************
function addOutlineToOverlay(Profile, overlay, width, type) {
	var roi = Profile.PSourceROI.clone();
	if (type == "stack") {
		var pos = Profile.PSliceNumber;
	}
	else {
		var pos = Profile.PRoiIndex+1;
	}
	roi.setStrokeWidth(width);
	// This is taken from the Line To Area command in IJ's Selection.java source
	ip2 = new ByteProcessor(Profile.PWidth, Profile.PHeight);
        ip2.setColor(255);
        if (roi.getType()==Roi.LINE && roi.getStrokeWidth()>1)
            ip2.fillPolygon(roi.getPolygon());
        else
            roi.drawPixels(ip2);
        ip2.setThreshold(255, 255, ImageProcessor.NO_LUT_UPDATE);
      	tts = new ThresholdToSelection();
        roi2 = tts.convert(ip2);	
        //
	roi2.setPosition(pos);
	roi2.setStrokeColor(new Color(1.0,0.0,0.0,0.2));
  	roi2.setStrokeWidth(1);
	overlay.add(roi2);
	return overlay;
}
//*************************************************************************************
// takes a Profile and overlay, returns an updated overlay with the begin, max and end as point ROIs
//*************************************************************************************
function addFToOverlay(Profile, Feature, overlay, type) {
	if (type == "stack") {
		var pos = Profile.PSliceNumber;
	}
	else {
		var pos = Profile.PRoiIndex+1;
	}	
	if (isNaN(Feature.FBeginIndex) == false) {
		var BeginX = Double.parseDouble(Profile.PXCoor[Feature.FBeginIndex]);
		var BeginY = Double.parseDouble(Profile.PYCoor[Feature.FBeginIndex]);	
		var roiB = new PointRoi(BeginX, BeginY);
		roiB.setPosition(pos);
		roiB.setStrokeColor(Color.GREEN);
		overlay.add(roiB);
	}
	
	var secMax = Math.min(Profile.PXCoor.length-1, Profile.PSmoothMaxIndex);
	var maxX = Double.parseDouble(Profile.PXCoor[secMax]);
	var maxY = Double.parseDouble(Profile.PYCoor[secMax]);
	var roiM = new PointRoi(maxX, maxY);
	roiM.setPosition(pos);
	roiM.setStrokeColor(Color.BLUE);
	overlay.add(roiM);
	if (isNaN(Feature.FEndIndex) == false) {
		var EndX = Double.parseDouble(Profile.PXCoor[Feature.FEndIndex]);
		var EndY = Double.parseDouble(Profile.PYCoor[Feature.FEndIndex]);	
		var roiE = new PointRoi(EndX, EndY);
		roiE.setPosition(pos);
		roiE.setStrokeColor(Color.MAGENTA);
		overlay.add(roiE);
	}
	return overlay;
}


//*************************************************************************************
// Functions thet generate the plot graph
//*************************************************************************************

//*************************************************************************************
// Adds the raw and smoothened profile to the plot
//*************************************************************************************
function addProfilePlot(Profile, plot) {	
	plot.setLineWidth(1);
	plot.setColor(Color.GRAY);
	plot.draw();
	plot.setColor(Color.BLACK);
	plot.setLineWidth(1);
	plot.addPoints(convertArrayD(Profile.PLineCoor), convertArrayD(Profile.PSmoothProfile), Plot.LINE);
	return plot;
}
//*************************************************************************************
// Adds the feature points on the plot: feature begin and end, max
// Also labels the plot in case there is no begin/end
//*************************************************************************************
function addFPlot(Profile, Feature, plot) {	
	
	// add begin, end and max on the plot + corresponding labels at the top
	plot.setLineWidth(8);
	plot.setColor(Color.GREEN);
	if (isNaN(Feature.FScaledBegin) == false) {
		plot.addPoints("",[Feature.FScaledBegin], [Profile.PSmoothProfile[Feature.FBeginIndex]], Plot.DOT);
		plot.addLabel(0, 0, "F Begin=" + Feature.FScaledBegin.toFixed(2));
	}
	else plot.addLabel(0, 0, "No F Begin");

	plot.setColor(Color.BLUE);
	plot.addPoints("",[Profile.PSmoothMaxIndexScaled], [Profile.PSmoothProfile[Profile.PSmoothMaxIndex]], Plot.DOT);
	plot.addLabel(0.16, 0, "F Max=" + Profile.PSmoothMaxIndexScaled.toFixed(2));

	plot.setColor(Color.MAGENTA);
	if (isNaN(Feature.FScaledEnd) == false){
		plot.addPoints("",[Feature.FScaledEnd], [Profile.PSmoothProfile[Feature.FEndIndex]], Plot.DOT);
		plot.addLabel(0.29, 0, "F End=" + Feature.FScaledEnd.toFixed(2));
	}
	else plot.addLabel(0.29, 0, "No F End");

	// add labels for length, mean int, and corrected mean int
	plot.setColor(Color.BLACK);
	if (isNaN(Feature.FScaledLength) == false){
		plot.addLabel(0.44, 0, "F Length=" + Feature.FScaledLength.toFixed(2));
	}
	else plot.addLabel(0.44, 0, "No F Length");

	plot.setColor(Color.BLACK);
	if (isNaN(Feature.FMeanInt) == false){
		plot.addLabel(0.61, 0, "F Mean=" + Feature.FMeanInt.toFixed(0));
	}
	else plot.addLabel(0.61, 0, "No F Mean");

	plot.setColor(Color.BLACK);
	if (isNaN(Feature.FMiCor) == false){
		plot.addLabel(0.77, 0, "F corr Mean=" + Feature.FMiCor.toFixed(0));
	}
	else plot.addLabel(0.77, 0, "No F corr Mean");
	
	return plot;
}

//*************************************************************************************
// Adds the fit on the plot here I have to add options depending on what is plotted
//*************************************************************************************
function addFitPlot(Profile, Feature, Fit, plot) {
	plot.setColor(Color.RED);
	plot.setLineWidth(1);
	plot.addPoints(convertArrayD(Profile.PLineCoor), convertArrayD(Fit.TCurve), Plot.LINE);

	plot.setColor(Color.RED);
	plot.addLabel(0, 0.04, "Fit: " + Fit.TEqType);
	
	plot.setColor(Color.RED);
	plot.addLabel(0.29, 0.04, "a=" + Fit.TParameters[0].toFixed(2));

	plot.setColor(Color.RED);
	plot.addLabel(0.55, 0.04, "b=" + Fit.TParameters[1].toFixed(2));

	plot.setColor(Color.RED);
	plot.addLabel(0.65, 0.04, "c=" + Fit.TParameters[2].toFixed(2));

	plot.setColor(Color.RED);
	plot.addLabel(0.75, 0.04, "d=" + Fit.TParameters[3].toFixed(2));
	
	plot.setColor(Color.RED);
	plot.addLabel(0.90, 0.04, "R2=" + Fit.TRSquared.toFixed(3));

	
	
	return plot;

	
}


//*************************************************************************************
//Function that define the Profile object and how to generate it
//*************************************************************************************

function profile(PWidth, PHeight, PBackground, PSourceROI, PStackName, PStackID, PPxSize, PPxUnit, PRoiName, PRoiIndex, PRoiLabel, PRoiType, PRoiColor, PRoiWidth, PSliceName, PSliceNumber, PXCoor, PYCoor, PScaledLength, PRawLength, PRawProfile, PLineCoor, PRawMin, PRawMax, PRawMeanInt, PRawIntDens, PHalfWidth, PSmoothProfile, PSmoothMin, PSmoothMax, PSmoothMaxIndex, PSmoothMaxIndexScaled, PNormProfile, PRawNormProfile, PRawNormMin, PRawNormMax, PHasFeature, PHasFits, PHasAlignment) {
	// int: image width (px)
	this.PWidth = PWidth;
	// int: image height (px)
	this.PHeight = PHeight;
	// float: image background
	this.PBackground = PBackground;
	// roi: source ROI	
	this.PSourceROI = PSourceROI;	
	// string: stack name	
	this.PStackName = PStackName;
	// int: stack ID
	this.PStackID = PStackID;
	// float: pixel size
	this.PPxSize = PPxSize;
	// string: pixel unit (µm, px...)
	this.PPxUnit = PPxUnit;
	// string: name of the ROI tracing along the Profile
	this.PRoiName = PRoiName;
	// int: index of roi in the roi manager
	this.PRoiIndex = PRoiIndex;
	// int: ROI label
	this.PRoiLabel = PRoiLabel;	
	// string: ROI label
	this.PRoiType = PRoiType;	
	// Java color: ROI color
	this.PRoiColor = PRoiColor;	
	// float: ROI width
	this.PRoiWidth = PRoiWidth;
	// string: short slice label of slice containing the ROI
	this.PSliceName = PSliceName;
	// int: slice number of slice containing the ROI
	this.PSliceNumber = PSliceNumber;
	// float array: X coordinates (1-pixel appart)
	this.PXCoor = PXCoor;
	// float array: Y coordinates (1-pixel appart)
	this.PYCoor = PYCoor;	
	// float: length of the ROI tracing (in units)
	this.PScaledLength = PScaledLength;
	// float: length of the ROI tracing (in px)
	this.PRawLength = PRawLength;
	// float array: raw intensity profile
	this.PRawProfile = PRawProfile;
	// float array: line coordinates (x coordinates in units for the intensity profile)
	this.PLineCoor = PLineCoor;
	// float: minimum of the raw profile
	this.PRawMin = PRawMin;
	// float: maximum of the raw profile
	this.PRawMax = PRawMax;
	// float: mean intensity of the ROI (int dens / length)
	this.PRawMeanInt = PRawMeanInt;
	// float: integrated density of the ROI (integral of the raw profile)
	this.PRawIntDens = PRawIntDens;
	// int: half-width of the sliding window for averaging
	this.PHalfWidth = PHalfWidth;
	// float array: smoothened (sliding-window averaged) intensity profile
	this.PSmoothProfile = PSmoothProfile;
	// float: minimum of the smoothened profile
	this.PSmoothMin = PSmoothMin;
	// float: maximum of the smoothened profile
	this.PSmoothMax = PSmoothMax;
	// float: index of the maximum for the smoothened profile
	this.PSmoothMaxIndex = PSmoothMaxIndex;
	// float: distance (in units) of the maximum for the smoothened profile
	this.PSmoothMaxIndexScaled = PSmoothMaxIndexScaled;
	// float array: normalized (to smoothMin and smoothMax) intensity profile
	this.PNormProfile = PNormProfile;
	// float array: raw normalized (using smoothMin and smoothMax) intensity profile
	this.PRawNormProfile = PRawNormProfile;
	// float: minimum of the raw normalized profile
	this.PRawNormMin = PRawNormMin;
	// float: maximum of the raw normalized profile
	this.PRawNormMax = PRawNormMax;
	// boolean: has a feature been processed for this profile?
	this.PHasFeature = PHasFeature;
	// boolean: have fits been processed for this profile?
	this.PHasFits = PHasFits;
	// boolean: has alignment been processed for this profile?
	this.PHasAlignment = PHasAlignment;
}

function feature(FProfileIndex, FBeginIndex, FScaledBegin, FEndIndex, FScaledEnd, FLength, FScaledLength, FMeanInt, FMiCor, FxCoor, FyCoor, FROI) {
	// int: index of the profile from which the feature has been computed
	this.FProfileIndex = FProfileIndex;
	// int: index of the feature begin along the profile
	this.FBeginIndex = FBeginIndex;
	// float: position (in units) of feature begin along the profile
	this.FScaledBegin = FScaledBegin;
	// int: index of the feature end along the profile
	this.FEndIndex = FEndIndex;
	// float: position (in units) of the feature end along the profile
	this.FScaledEnd = FScaledEnd;
	// int: raw length of feature
	this.FLength = FLength;
	// float: scaled length of the feature
	this.FScaledLength = FScaledLength;
	// float: mean intensity along the feature
	this.FMeanInt = FMeanInt;
	// float: background-corrected mean intensity along the feature
	this.FMiCor = FMiCor;	
	// float array: feature X coordinates (1-pixel appart)
	this.FxCoor = FxCoor;
	// float array: feature Y coordinates (1-pixel appart)
	this.FyCoor = FyCoor;
	// roi: Feature ROI	
	this.FROI = FROI;	
		
}

function fit(TProfileIndex, TEqType, TFit, TFitX, TFitY, TParameters, TRSquared, TCurve, TCurveMax, TCurveMaxIndex, TCurveMin, TNormCurve) {
	// int: index of the profile from which the fit has been computed
	this.TProfileIndex = TProfileIndex;
	// variable: type of fit (equation)
	this.TEqType = TEqType;
	// object: curve fitter
	this.TFit = TFit;
	// array: fitted profile X
	this.TFitX = TFitX;
	// array: fitted profile Y
	this.TFitY = TFitY;
	// array: fit parameters
	this.TParameters = TParameters;
	// float: R squared of the fit
	this.TRSquared = TRSquared;
	// float array: fit curve
	this.TCurve = TCurve;
	// float: fit curve max
	this.TCurveMax = TCurveMax;
	// int: fit curve max index
	this.TCurveMaxIndex = TCurveMaxIndex;
	// int: fit curve min
	this.TCurveMin = TCurveMin;
	// float array: fit curve normalized
	this.TNormCurve = TNormCurve;
}

function align(AProfileIndex, AMasterPos, AShiftLeft, AShiftRight, AXScaled, ARawProfile, ASmoothProfile, ANormProfile, ARawNormProfile, ACurve, ANormCurve) {
	// int: index of the profile from which the fit has been computed
	this.AProfileIndex = AProfileIndex;
	// int: position of the master position for alignment on the original non-aligned profile
	this.AMasterPos = AMasterPos;
	// int: shift at the beginning of the array
	this.AShiftLeft = AShiftLeft;
	// int: shift at the end of the array
	this.AShiftRigth = AShiftRight;
	// array: aligned profile X
	this.AXScaled = AXScaled;
	// array: aligned profile raw
	this.ARawProfile = ARawProfile;
	// array: aligned profile smooth
	this.ASmoothProfile = ASmoothProfile;
	// array: aligned profile norm
	this.ANormProfile = ANormProfile;
	// array: aligned profile raw norm
	this.ARawNormProfile = ARawNormProfile;
	// array: aligned fit curve
	this.ACurve = ACurve;
	// array: aligned fit curve norm
	this.ANormCurve = ANormCurve;
}



//*************************************************************************************
//*************************************************************************************
//*************************************************************************************
//*************************************************************************************
