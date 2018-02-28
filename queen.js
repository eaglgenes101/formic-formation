/*
Queen: Everything revolves around her. She is the one to be fed, she births all the workers, and she forms the right side of the marching formation. 

Strategy: For the opener (detected by the lack of surrounding workers), the queen moves in a straight line via color 3 (cyan), then once she has food, she spawns a gatherer. From there is the early phase, where the queen and the gatherer move at lightspeed. And then from there, the real march starts. If the queen is in formation but loses her gatherer, she spawns another one. 

If the queen loses the formation but has a gatherer or has food, she spawns a gatherer if needed and revers to early-phase. If she loses all food and the gatherer, she sends a panic, then reverts to the opener. 
*/

//Opening-phase queen (when the gatherer is not visible and the queen has no food)
function opening_queen()
{
	if (this_ant().food > 0) return {cell:0, type:GATHERER};

	//If one of the adjacent spaces has food, gather it
	for (try_cell of SCAN_ORDER)
		if (view[try_cell].food === 1) return {cell:try_cell};

	//Actively avoid other workers
	for (try_cell of SCAN_ORDER)
		if (view[try_cell].ant !== null) return {cell:LH_ENUMERATION[try_cell][4]};

	//If the color at the current cell is 0 (white), color it 4 (cyan)
	if (view[4].color !== 6) return {cell: 4, color: 6};

	//If any of the ground is cyan, avoid it.
	//Otherwise, just choose a direction that won't cause a run-in. 
	else if (view[0].color !== 6 && view[8].color === 6) return {cell:0};
	else if (view[2].color !== 6 && view[6].color === 6) return {cell:2};
	else if (view[6].color !== 6 && view[2].color === 6) return {cell:6};
	else if (view[8].color !== 6 && view[0].color === 6) return {cell:8};
	else if (view[2].color === 6 && view[6].color === 6 && view[0].color !== 6) return {cell:0};
	else if (view[0].color === 6 && view[8].color === 6 && view[2].color !== 6) return {cell:2};
	else if (view[0].color === 6 && view[8].color === 6 && view[6].color !== 6) return {cell:6};
	else if (view[2].color === 6 && view[6].color === 6 && view[8].color !== 6) return {cell:8};

	else return {cell:0};
	
}

//Early-phase queen (when the queen and the gatherer are moving together at lightspeed, trying to find more food)
function early_queen()
{

	//Find the gatherer, revolve counterclockwise around her
	var gatherer_cell = null;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true && view[try_cell].ant.type === GATHERER)
		{
			gatherer_cell = try_cell;
			break;
		}
	}

	if (gatherer_cell === null || gatherer_cell%2 === 0) return {cell:4};


	//Once the gatherer is orthogonal to us, spawn an A-phase marcher
	if (gatherer_cell%2 === 1 && this_ant().food > 0) return {cell:LH_ENUMERATION[gatherer_cell][2], type:MARCHER_A}


	return {cell:LH_ENUMERATION[gatherer_cell][1]};
}

function queen_decision()
{
	marcher_count = 0;
	gatherer_count = 0;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true)
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
				marcher_count++;
			if (view[try_cell].ant.type === GATHERER)
				gatherer_count++;
		}
	}
	/*
	if (marcher_count > 0)
	{
		
	}
	*/
	if (gatherer_count === 1)
	{
		return sanitize(early_queen(), LEFT_ORDER);
	}
	return sanitize(opening_queen(), FREE_ORDER);
}
