##“Measure ROIs” macros set

• This set of macros is used to define region of interests on images and measure their characteristics (area, intensity...). The workflow is divided in two part.

• The first part allows you to generate categorized ROIs for feature of interests on all images from a given channel by three different methods :

1. You can use NeuronJ to semi-automatically generate line tracings along neurites. This is done using the first three macros: Generate Tracings Folder, Launch NeuronJ and Convert NDF to ROI.

2. You can use manually traced ROIs using standard ImageJ tools (rectangle, circle, line...) and assign a category to them. This is done using the two macros: Add ROI and Modify ROIs.

3. Once line tracings have been generated, you can additionally detect features along the intensity profiles (such as the AIS) using the ProFeatFit script (Launch ProFitFit macro).

"Categorized" mean that you can assign categories to the ROIs (dendrite, axon, transfected, non-transfected...). The outputs of this part are RoiSets, i.e. set of ROIs as .zip file that can be opened in the ImageJ ROI manager and assigned to the currently active stack by dropping them on the ImageJ toolbar. ROIs are meant to be generated on a given channel (marker for the AIS, map2 staining...). The measurements can be performed on this channel or, by opening the ROIs on another single-channel stack, performed on other channels from the same experiment.

• The second part allows you to measure all the ROIs on a single-channel stack (Measure Intensities macro), and to calculate intensity ratios between different ROI categories for each image, for example axon/dendrite or transfected/non-transfected (Calculate Ratios macro). These two macros generate ImageJ Results Tables that you can save as .txt or .csv files.

Please see the detailed tutorial here (while I try to find a way to convert an Evernote note into a markdown ReadMe):
https://www.evernote.com/shard/s2/sh/78f84e1b-dff2-43cc-9050-783afb99056c/f15e650b16a83777
