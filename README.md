# Scientific_Visualization
Scientific Visualization: GPU Based ray-casting to analyse data

In this section I implemented following tasks for volume stored in 3D textures

1. Average intensity projection.
2. A first-hit ray traversal scheme for variable thresholds
to visualize isosurfaces.
3. Improved the intersection search using a binary search method.
4. A function get_gradient() to calculate the gradient at a given
volume sampling position. 
5. The surface normal for the found intersection point and a basic illumination for the iso-surface. 
6. Illumination calculation for the correct display of surface shadows.
7. A front-to-back compositing traversal scheme.
8. Used the generated volume gradients to calculate the local
illumination for the volume samples during the compositing.
9. Extended the compositing algorithm with opacity correction.
10. Based on the solution of assignments 2 and 3, extracted a second isosurface
at a different threshold and use front-to-back compositing to visualize both
isosurfaces in accordance with the transfer function.
(2nd file)
