/*

The gatherer is the right hand (wo)man to the queen. She guides her during the early phase, she gets food for her during midgame, and she tells her to not revert to early-game tactics. 

*/

function early_gatherer()
{
	//Revolve clockwise around the queen
	var queen_cell = null;
	var food_count = 0;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true && view[try_cell].ant.type === QUEEN)
		{
			queen_cell = try_cell;
			break;
		}
		if (view[try_cell].food > 0)
		{
			return {cell:4};
		}
	}
	if (queen_cell === null)
		return {cell:4};
	//If a food cell is adjacent to the queen, get it
	if (this_ant().food === 0)
	{
		if (view[0].food > 0 && (queen_cell === 1 || queen_cell === 3)) return {cell:0};
		if (view[2].food > 0 && (queen_cell === 1 || queen_cell === 5)) return {cell:2};
		if (view[8].food > 0 && (queen_cell === 7 || queen_cell === 5)) return {cell:8};
		if (view[6].food > 0 && (queen_cell === 7 || queen_cell === 3)) return {cell:6};
		if (view[1].food > 0 && (queen_cell === 0 || queen_cell === 2 || queen_cell === 3 || queen_cell === 5))
			return {cell:1};
		if (view[3].food > 0 && (queen_cell === 0 || queen_cell === 6 || queen_cell === 1 || queen_cell === 7))
			return {cell:3};
		if (view[7].food > 0 && (queen_cell === 8 || queen_cell === 6 || queen_cell === 3 || queen_cell === 5))
			return {cell:7};
		if (view[5].food > 0 && (queen_cell === 8 || queen_cell === 2 || queen_cell === 1 || queen_cell === 7))
			return {cell:5};
	}
	return {cell:RH_ENUMERATION[queen_cell][7]};
	
}

function gatherer_decision()
{
	marcher_count = 0;
	queen_count = 0;
	for (try_cell of SCAN_ORDER)
	{
		if (view[try_cell].ant !== null && view[try_cell].ant.friend === true)
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B)
				marcher_count++;
			if (view[try_cell].ant.type === QUEEN)
				queen_count++;
		}
	}
	/*
	if (marcher_count > 0)
	{
		
	}
	*/
	if (queen_count === 1)
	{
		return sanitize(early_gatherer(), RIGHT_ORDER);
	}
	return sanitize(saboteur(), FREE_ORDER);
}
