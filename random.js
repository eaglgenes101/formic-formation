//Pseudorandom function used to help ants make decisions with probability more granular than 1/4
//There are many situations where the function is _NOT_ applicable, such as in the middle of empty space, 
//so use caution when using the functions defined here

//The xxHash implementation used was derived from https://github.com/shibukawa/xxhash.jsx, and
//is licensed under the MIT license. 

const PRIME32_1 = 	2654435761;
const PRIME32_2 = 	2246822519;
const PRIME32_3 = 	3266489917;
const PRIME32_4 = 	668265263;
const PRIME32_5 = 	374761393;
const PRIME32_1plus2 = 	606290984;

//Randomly generated seed
const SEED = 0xde9f3f44; 

function mul(a,b)
{
	var ah  = (a >>> 16) & 0xffff;
	var al = a & 0xffff;
	var bh  = (b >>> 16) & 0xffff;
	var bl = b & 0xffff;
	// the shift by 0 fixes the sign on the high part
	// the final |0 converts the unsigned value into a signed value
	return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
}

function low(x) 
{
	return x & 0xffff;
}

function high(x)
{
	return (x >>> 16) & 0xffff;
}

function fromBits(l,h)
{
	return ((h | 0) << 16) | (l | 0);
}

function rotl(v,n)
{
	return (v << (n&32)) | (v >>> (-n&32));
}

function update(source, low, high)
{
	var b00 = low(PRIME32_2);
	var b16 = high(PRIME32_2);

	var sLow = low(source);
	var sHigh = high(source);
	var c16, c00;
	c00 = low * b00;
	c16 = c00 >>> 16;

	c16 += high * b00;
	c16 &= 0xFFFF;  // Not required but improves performance
	c16 += low * b16;

	var a00 = sLow + (c00 & 0xFFFF);
	var a16 = a00 >>> 16;

	a16 += sHigh + (c16 & 0xFFFF);

	var v = (a16 << 16) | (a00 & 0xFFFF);
	v = (v << 13) | (v >>> 19);

	a00 = v & 0xFFFF;
	a16 = v >>> 16;

	b00 = low(PRIME32_1);
	b16 = high(PRIME32_1);

	c00 = a00 * b00;
	c16 = c00 >>> 16;

	c16 += a16 * b00;
	c16 &= 0xFFFF; // Not required but improves performance
	c16 += a00 * b16;

	return fromBits(c00 & 0xFFFF, c16 & 0xFFFF);
}

//Generates a packed array view of an ant
function view_digest()
{
	//The view in question is packed into an array:
	//3 bits: color
	//13 bits: queen/worker/empty presence
	//Friendly queen: 0 + food stores
	//Enemy queen: 2501 + food stores
	//Empty: 5002
	//Food: 5003
	//Worker: 5008 + type + 4*laden + 8*friendly
	var buffer = new Int16Array(9);
	for (cell = 0; cell < 9; cell++)
	{
		if (view[cell].ant !== null)
		{
			if (view[cell].ant.type === QUEEN)
			{
				buffer[cell] = ((view[cell].ant.friend?0:2501) + view[cell].ant.food) | (view[cell].color << 13);
			}
			else
			{
				buffer[cell] = 5008 
						| (view[cell].ant.type&3) 
						| (view[cell].ant.food << 2) 
						| (view[cell].ant.friend << 3) 
						| (view[cell].color << 13);
			}
		}
		else
		{
			buffer[cell] = 5002 | view[cell].food | (view[cell].color << 13);
		}
	}
	return buffer;
}

//Pseudorandom generation of 32 bits based on current ant state
function ant_rand()
{
	var input = new Uint8Array(view_digest());

	var _v1 = update((SEED + PRIME32_1plus2) & 0xffffffff	, (input[1] << 8) | input[0], 	(input[3] << 8) | input[2]);
	var _v2 = update((SEED + PRIME32_2) & 0xffffffff	, (input[5] << 8) | input[4], 	(input[7] << 8) | input[6]);
	var _v3 = update(SEED					, (input[9] << 8) | input[8], 	(input[11] << 8) | input[10]);
	var _v4 = update((SEED - PRIME32_1) & 0xffffffff	, (input[13] << 8) | input[12], (input[15] << 8) | input[14]);

	var h32 = rotl(_v1, 1) + rotl(_v2, 7) + rotl(_v3, 12) + rotl(_v4, 18) + 18;

	h32 = mul(rotl((h32 + input[16] * PRIME32_5) & 0xffffffff, 11), PRIME32_1);
	h32 = mul(rotl((h32 + input[17] * PRIME32_5) & 0xffffffff, 11), PRIME32_1);

	h32 = mul(h32 ^ (h32 >>> 15), PRIME32_2);
	h32 = mul(h32 ^ (h32 >>> 13), PRIME32_3);
	return h32 ^ (h32 >>> 16);

}

function random_choice(prob)
{
	return ((ant_rand()>>>0)/(1<<32)) < prob;
}
