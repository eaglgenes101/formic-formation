//Pseudorandom function used to help ants make decisions with probability more granular than 1/4
//There are many situations where the function is _NOT_ applicable, such as in the middle of empty space, 
//so use caution when using the functions defined here

//The xxHash implementation used was derived from https://github.com/shibukawa/xxhash.jsx, and
//is licensed under the MIT license. 

const P_1 = 	2654435761;
const P_2 = 	2246822519;
const P_3 = 	3266489917;
const P_4 = 	668265263;
const P_5 = 	374761393;
const P_6 = 	606290984;
const M16 = 	65535;
const M32 = 	4294967295;

//Randomly generated seed
const SEED = 	3734978372; 

function lo_w(x) 
{
	return x & M16;
}

function hi_w(x)
{
	return (x >>> 16) & M16;
}

function fromBits(l,h)
{
	return ((h | 0) << 16) | (l | 0);
}

function rotl(v,n)
{
	return (v << (n&32)) | (v >>> (-n&32));
}

function mul(a,b)
{
	var ah  = (a >>> 16) & M16;
	var al = a & M16;
	var bh  = (b >>> 16) & M16;
	var bl = b & M16;
	// the shift by 0 fixes the sign on the high part
	// the final |0 converts the unsigned value into a signed value
	return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
}

function umul(a,bh,bl)
{
	var ah  = (a >>> 16) & M16;
	var al = a & M16;
	// the shift by 0 fixes the sign on the high part
	return (al * bl) + (((ah * bl + al * bh) << 16) >>> 0);
}

function new_update(source, low, high)
{
	return mul(rotl((source + umul(P_2, high, low))&M32, 13), P_1);
}

function update(source, low, high)
{
	var c00 = low * lo_w(P_2);
	var c16 = c00 >>> 16;

	c16 += high * lo_w(P_2);
	c16 &= M16;  // Not required but improves performance
	c16 += low * hi_w(P_2);

	var a00 = lo_w(source) + (c00 & M16);
	var a16 = a00 >>> 16;

	a16 += hi_w(source) + (c16 & M16);

	var v = rotl((a16 << 16) | (a00 & M16), 13);

	a00 = v & M16;
	a16 = v >>> 16;

	c00 = a00 * lo_w(P_1);
	c16 = c00 >>> 16;

	c16 += a16 * lo_w(P_1);
	c16 &= M16; // Not required but improves performance
	c16 += a00 * hi_w(P_1);

	return fromBits(c00 & M16, c16 & M16);
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
	for (var cell = 0; cell < 9; cell++)
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
						| (view[cell].ant.type & 3) 
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
	var input = view_digest();

	var _v1 = update((SEED + P_6) & M32, input[0], input[1]);
	var _v2 = update((SEED + P_2) & M32, input[2], input[3]);
	var _v3 = update( SEED             , input[4], input[5]);
	var _v4 = update((SEED - P_1) & M32, input[6], input[7]);

	var h32 = rotl(_v1, 1) + rotl(_v2, 7) + rotl(_v3, 12) + rotl(_v4, 18) + 18;

	h32 = mul(rotl((h32 + lo_w(input[8]) * P_5) & M32, 11), P_1);
	h32 = mul(rotl((h32 + hi_w(input[8]) * P_5) & M32, 11), P_1);

	h32 = mul(h32 ^ (h32 >>> 15), P_2);
	h32 = mul(h32 ^ (h32 >>> 13), P_3);
	return h32 ^ (h32 >>> 16);

}

function random_choice(prob)
{
	return (ant_rand()>>>0)/(M32+1) < prob;
}
