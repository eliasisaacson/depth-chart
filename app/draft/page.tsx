"use client";
import { useState, useMemo, useCallback } from "react";

// ── 6-Source Weighted Consensus ─────────────────────────────────────────────
// Insider (2x): 4for4 VOR, FantasyPros ECR (100+ experts via Bleacher Report)
// Standard (1x): ESPN Yates, CBS Sports, NFLFantasyEdge ADP, ESPN Mike Clay
// Updated Sep 4 2026
const PLAYERS = [
  {id:1,name:"Jahmyr Gibbs",team:"DET",pos:"RB",bye:6,tier:"Elite",adp:1.1},
  {id:2,name:"Bijan Robinson",team:"ATL",pos:"RB",bye:11,tier:"Elite",adp:1.9},
  {id:3,name:"Ja'Marr Chase",team:"CIN",pos:"WR",bye:6,tier:"Elite",adp:3.6},
  {id:4,name:"Jaxon Smith-Njigba",team:"SEA",pos:"WR",bye:11,tier:"Elite",adp:5.0},
  {id:5,name:"Puka Nacua",team:"LAR",pos:"WR",bye:11,tier:"Elite",adp:5.0},
  {id:6,name:"Jonathan Taylor",team:"IND",pos:"RB",bye:13,tier:"Tier 1",adp:5.9},
  {id:7,name:"Amon-Ra St. Brown",team:"DET",pos:"WR",bye:6,tier:"Tier 1",adp:8.2},
  {id:8,name:"James Cook III",team:"BUF",pos:"RB",bye:7,tier:"Tier 1",adp:9.1},
  {id:9,name:"De'Von Achane",team:"MIA",pos:"RB",bye:6,tier:"Tier 1",adp:10.0},
  {id:10,name:"Christian McCaffrey",team:"SF",pos:"RB",bye:8,tier:"Tier 1",adp:10.2},
  {id:11,name:"Justin Jefferson",team:"MIN",pos:"WR",bye:6,tier:"Tier 1",adp:11.8},
  {id:12,name:"CeeDee Lamb",team:"DAL",pos:"WR",bye:14,tier:"Tier 1",adp:12.8},
  {id:13,name:"Saquon Barkley",team:"PHI",pos:"RB",bye:10,tier:"Tier 1",adp:16.1},
  {id:14,name:"Chase Brown",team:"CIN",pos:"RB",bye:6,tier:"Tier 1",adp:16.1},
  {id:15,name:"Omarion Hampton",team:"LAC",pos:"RB",bye:7,tier:"Tier 1",adp:17.1},
  {id:16,name:"Drake London",team:"ATL",pos:"WR",bye:11,tier:"Tier 2",adp:17.4},
  {id:17,name:"A.J. Brown",team:"NE",pos:"WR",bye:11,tier:"Tier 2",adp:18.5},
  {id:18,name:"Derrick Henry",team:"BAL",pos:"RB",bye:13,tier:"Tier 2",adp:18.8},
  {id:19,name:"Ashton Jeanty",team:"LV",pos:"RB",bye:13,tier:"Tier 2",adp:20.6},
  {id:20,name:"Kenneth Walker",team:"KC",pos:"RB",bye:5,tier:"Tier 2",adp:21.0},
  {id:21,name:"Nico Collins",team:"HOU",pos:"WR",bye:8,tier:"Tier 2",adp:21.9},
  {id:22,name:"George Pickens",team:"DAL",pos:"WR",bye:14,tier:"Tier 2",adp:21.9},
  {id:23,name:"Brock Bowers",team:"LV",pos:"TE",bye:13,tier:"Tier 2",adp:22.2},
  {id:24,name:"Chris Olave",team:"NO",pos:"WR",bye:8,tier:"Tier 2",adp:22.9},
  {id:25,name:"Trey McBride",team:"ARI",pos:"TE",bye:14,tier:"Tier 2",adp:24.8},
  {id:26,name:"Josh Allen",team:"BUF",pos:"QB",bye:7,tier:"Tier 2",adp:28.0},
  {id:27,name:"Rashee Rice",team:"KC",pos:"WR",bye:5,tier:"Tier 2",adp:28.6},
  {id:28,name:"DeVonta Smith",team:"PHI",pos:"WR",bye:10,tier:"Tier 2",adp:28.9},
  {id:29,name:"Jeremiyah Love",team:"ARI",pos:"RB",bye:14,tier:"Tier 2",adp:29.8},
  {id:30,name:"Malik Nabers",team:"NYG",pos:"WR",bye:8,tier:"Tier 2",adp:31.0},
  {id:31,name:"Javonte Williams",team:"DAL",pos:"RB",bye:14,tier:"Tier 3",adp:31.4},
  {id:32,name:"Garrett Wilson",team:"NYJ",pos:"WR",bye:13,tier:"Tier 3",adp:31.5},
  {id:33,name:"Kyren Williams",team:"LAR",pos:"RB",bye:11,tier:"Tier 3",adp:31.6},
  {id:34,name:"Zay Flowers",team:"BAL",pos:"WR",bye:13,tier:"Tier 3",adp:32.8},
  {id:35,name:"Breece Hall",team:"NYJ",pos:"RB",bye:13,tier:"Tier 3",adp:34.6},
  {id:36,name:"Tetairoa McMillan",team:"CAR",pos:"WR",bye:5,tier:"Tier 3",adp:37.8},
  {id:37,name:"Travis Etienne Jr.",team:"NO",pos:"RB",bye:8,tier:"Tier 3",adp:38.4},
  {id:38,name:"Jaylen Waddle",team:"DEN",pos:"WR",bye:10,tier:"Tier 3",adp:39.2},
  {id:39,name:"Emeka Egbuka",team:"TB",pos:"WR",bye:10,tier:"Tier 3",adp:39.2},
  {id:40,name:"Colston Loveland",team:"CHI",pos:"TE",bye:10,tier:"Tier 3",adp:40.8},
  {id:41,name:"Cam Skattebo",team:"NYG",pos:"RB",bye:8,tier:"Tier 3",adp:41.9},
  {id:42,name:"D'Andre Swift",team:"CHI",pos:"RB",bye:10,tier:"Tier 3",adp:45.0},
  {id:43,name:"Quinshon Judkins",team:"CLE",pos:"RB",bye:11,tier:"Tier 3",adp:47.4},
  {id:44,name:"Tee Higgins",team:"CIN",pos:"WR",bye:6,tier:"Tier 3",adp:48.5},
  {id:45,name:"Bucky Irving",team:"TB",pos:"RB",bye:10,tier:"Tier 3",adp:49.4},
  {id:46,name:"Ladd McConkey",team:"LAC",pos:"WR",bye:7,tier:"Tier 3",adp:51.0},
  {id:47,name:"Lamar Jackson",team:"BAL",pos:"QB",bye:13,tier:"Tier 3",adp:52.0},
  {id:48,name:"Bhayshul Tuten",team:"JAX",pos:"RB",bye:7,tier:"Tier 3",adp:56.4},
  {id:49,name:"Drake Maye",team:"NE",pos:"QB",bye:11,tier:"Tier 3",adp:58.4},
  {id:50,name:"David Montgomery",team:"HOU",pos:"RB",bye:8,tier:"Tier 3",adp:60.8},
  {id:51,name:"Tyler Warren",team:"IND",pos:"TE",bye:13,tier:"Tier 4",adp:65.9},
  {id:52,name:"Davante Adams",team:"LAR",pos:"WR",bye:11,tier:"Tier 4",adp:67.2},
  {id:53,name:"Rhamondre Stevenson",team:"NE",pos:"RB",bye:11,tier:"Tier 4",adp:68.4},
  {id:54,name:"Jadarian Price",team:"SEA",pos:"RB",bye:11,tier:"Tier 4",adp:69.1},
  {id:55,name:"Luther Burden III",team:"CHI",pos:"WR",bye:10,tier:"Tier 4",adp:69.2},
  {id:56,name:"Terry McLaurin",team:"WAS",pos:"WR",bye:7,tier:"Tier 4",adp:69.4},
  {id:57,name:"DJ Moore",team:"BUF",pos:"WR",bye:7,tier:"Tier 4",adp:70.1},
  {id:58,name:"Jameson Williams",team:"DET",pos:"WR",bye:6,tier:"Tier 4",adp:71.9},
  {id:59,name:"Jayden Daniels",team:"WAS",pos:"QB",bye:7,tier:"Tier 4",adp:71.9},
  {id:60,name:"Christian Watson",team:"GB",pos:"WR",bye:11,tier:"Tier 4",adp:77.4},
  {id:61,name:"Jalen Hurts",team:"PHI",pos:"QB",bye:10,tier:"Tier 4",adp:77.9},
  {id:62,name:"Joe Burrow",team:"CIN",pos:"QB",bye:6,tier:"Tier 4",adp:78.6},
  {id:63,name:"Rome Odunze",team:"CHI",pos:"WR",bye:10,tier:"Tier 4",adp:78.6},
  {id:64,name:"Parker Washington",team:"JAX",pos:"WR",bye:7,tier:"Tier 4",adp:78.8},
  {id:65,name:"Mike Evans",team:"SF",pos:"WR",bye:8,tier:"Tier 4",adp:79.4},
  {id:66,name:"Jaylen Warren",team:"PIT",pos:"RB",bye:9,tier:"Tier 4",adp:82.8},
  {id:67,name:"TreVeyon Henderson",team:"NE",pos:"RB",bye:11,tier:"Tier 4",adp:84.2},
  {id:68,name:"Tony Pollard",team:"TEN",pos:"RB",bye:9,tier:"Tier 4",adp:84.6},
  {id:69,name:"DK Metcalf",team:"PIT",pos:"WR",bye:9,tier:"Tier 4",adp:87.2},
  {id:70,name:"Brian Thomas Jr.",team:"JAX",pos:"WR",bye:7,tier:"Tier 4",adp:88.0},
  {id:71,name:"Rico Dowdle",team:"PIT",pos:"RB",bye:9,tier:"Tier 4",adp:88.0},
  {id:72,name:"Chris Godwin Jr.",team:"TB",pos:"WR",bye:10,tier:"Tier 4",adp:88.2},
  {id:73,name:"Tucker Kraft",team:"GB",pos:"TE",bye:11,tier:"Tier 4",adp:90.0},
  {id:74,name:"Jonathon Brooks",team:"CAR",pos:"RB",bye:5,tier:"Tier 4",adp:94.1},
  {id:75,name:"Marvin Harrison Jr.",team:"ARI",pos:"WR",bye:14,tier:"Tier 4",adp:96.1},
  {id:76,name:"Sam LaPorta",team:"DET",pos:"TE",bye:6,tier:"Tier 5",adp:96.1},
  {id:77,name:"Carnell Tate",team:"TEN",pos:"WR",bye:9,tier:"Tier 5",adp:99.1},
  {id:78,name:"Dak Prescott",team:"DAL",pos:"QB",bye:14,tier:"Tier 5",adp:101.0},
  {id:79,name:"Caleb Williams",team:"CHI",pos:"QB",bye:10,tier:"Tier 5",adp:101.6},
  {id:80,name:"Kyle Pitts Sr.",team:"ATL",pos:"TE",bye:11,tier:"Tier 5",adp:102.1},
  {id:81,name:"Courtland Sutton",team:"DEN",pos:"WR",bye:10,tier:"Tier 5",adp:102.4},
  {id:82,name:"Alec Pierce",team:"IND",pos:"WR",bye:13,tier:"Tier 5",adp:105.9},
  {id:83,name:"Trevor Lawrence",team:"JAX",pos:"QB",bye:7,tier:"Tier 5",adp:107.8},
  {id:84,name:"Michael Wilson",team:"ARI",pos:"WR",bye:14,tier:"Tier 5",adp:107.8},
  {id:85,name:"J.K. Dobbins",team:"DEN",pos:"RB",bye:10,tier:"Tier 5",adp:109.6},
  {id:86,name:"Kenny Gainwell",team:"TB",pos:"RB",bye:10,tier:"Tier 5",adp:110.0},
  {id:87,name:"RJ Harvey",team:"DEN",pos:"RB",bye:10,tier:"Tier 5",adp:110.2},
  {id:88,name:"Harold Fannin Jr.",team:"CLE",pos:"TE",bye:11,tier:"Tier 5",adp:110.4},
  {id:89,name:"Stefon Diggs",team:"WAS",pos:"WR",bye:7,tier:"Tier 5",adp:111.5},
  {id:90,name:"George Kittle",team:"SF",pos:"TE",bye:8,tier:"Tier 5",adp:111.5},
  {id:91,name:"Michael Pittman Jr.",team:"PIT",pos:"WR",bye:9,tier:"Tier 5",adp:111.9},
  {id:92,name:"Justin Herbert",team:"LAC",pos:"QB",bye:7,tier:"Tier 5",adp:112.6},
  {id:93,name:"Wan'Dale Robinson",team:"TEN",pos:"WR",bye:9,tier:"Tier 5",adp:114.0},
  {id:94,name:"Chuba Hubbard",team:"CAR",pos:"RB",bye:5,tier:"Tier 5",adp:114.0},
  {id:95,name:"Matthew Stafford",team:"LAR",pos:"QB",bye:11,tier:"Tier 5",adp:114.0},
  {id:96,name:"Jakobi Meyers",team:"JAX",pos:"WR",bye:7,tier:"Tier 5",adp:115.9},
  {id:97,name:"Jordan Mason",team:"MIN",pos:"RB",bye:6,tier:"Tier 5",adp:116.5},
  {id:98,name:"Travis Kelce",team:"KC",pos:"TE",bye:5,tier:"Tier 5",adp:118.8},
  {id:99,name:"Quentin Johnston",team:"LAC",pos:"WR",bye:7,tier:"Tier 5",adp:119.5},
  {id:100,name:"Josh Downs",team:"IND",pos:"WR",bye:13,tier:"Tier 5",adp:120.5},
  {id:101,name:"Jayden Reed",team:"GB",pos:"WR",bye:11,tier:"Tier 6",adp:121.2},
  {id:102,name:"Makai Lemon",team:"PHI",pos:"WR",bye:10,tier:"Tier 6",adp:121.8},
  {id:103,name:"MarShawn Lloyd",team:"GB",pos:"RB",bye:11,tier:"Tier 6",adp:121.8},
  {id:104,name:"Bo Nix",team:"DEN",pos:"QB",bye:10,tier:"Tier 6",adp:122.2},
  {id:105,name:"Josh Jacobs",team:"GB",pos:"RB",bye:11,tier:"Tier 6",adp:122.5},
  {id:106,name:"Jacory Croskey-Merritt",team:"WAS",pos:"RB",bye:7,tier:"Tier 6",adp:123.9},
  {id:107,name:"Isaiah Likely",team:"NYG",pos:"TE",bye:8,tier:"Tier 6",adp:124.0},
  {id:108,name:"Jordan Addison",team:"MIN",pos:"WR",bye:6,tier:"Tier 6",adp:124.1},
  {id:109,name:"Brock Purdy",team:"SF",pos:"QB",bye:8,tier:"Tier 6",adp:124.4},
  {id:110,name:"Blake Corum",team:"LAR",pos:"RB",bye:11,tier:"Tier 6",adp:125.8},
  // Extended offensive players (131-164)
  {id:111,name:"Rachaad White",team:"WAS",pos:"RB",bye:7,tier:"Tier 6",adp:126.0},
  {id:112,name:"Kyle Monangai",team:"CHI",pos:"RB",bye:10,tier:"Tier 6",adp:127.5},
  {id:113,name:"Jared Goff",team:"DET",pos:"QB",bye:6,tier:"Tier 6",adp:129.0},
  {id:114,name:"Daniel Jones",team:"IND",pos:"QB",bye:13,tier:"Tier 6",adp:130.5},
  {id:115,name:"C.J. Stroud",team:"HOU",pos:"QB",bye:8,tier:"Tier 6",adp:132.0},
  {id:116,name:"Malik Willis",team:"MIA",pos:"QB",bye:6,tier:"Tier 6",adp:133.5},
  {id:117,name:"Cam Ward",team:"TEN",pos:"QB",bye:9,tier:"Tier 6",adp:135.0},
  {id:118,name:"Tyler Shough",team:"NO",pos:"QB",bye:8,tier:"Tier 6",adp:136.5},
  {id:119,name:"Xavier Worthy",team:"KC",pos:"WR",bye:5,tier:"Tier 6",adp:138.0},
  {id:120,name:"Tyjae Spears",team:"TEN",pos:"RB",bye:9,tier:"Tier 6",adp:139.5},
  {id:121,name:"Juwan Johnson",team:"NO",pos:"TE",bye:8,tier:"Tier 6",adp:141.0},
  {id:122,name:"Brian Robinson Jr.",team:"ATL",pos:"RB",bye:11,tier:"Tier 6",adp:142.5},
  {id:123,name:"Mike Washington Jr.",team:"LV",pos:"RB",bye:13,tier:"Tier 6",adp:144.0},
  {id:124,name:"Matthew Golden",team:"GB",pos:"WR",bye:11,tier:"Tier 6",adp:145.5},
  {id:125,name:"De'Zhaun Stribling",team:"SF",pos:"WR",bye:8,tier:"Tier 7",adp:147.0},
  {id:126,name:"AJ Barner",team:"SEA",pos:"TE",bye:11,tier:"Tier 7",adp:148.5},
  {id:127,name:"Hunter Henry",team:"NE",pos:"TE",bye:11,tier:"Tier 7",adp:150.0},
  {id:128,name:"Dontayvion Wicks",team:"GB",pos:"WR",bye:11,tier:"Tier 7",adp:151.5},
  {id:129,name:"Jalen Tolbert",team:"DAL",pos:"WR",bye:14,tier:"Tier 7",adp:153.0},
  {id:130,name:"Cedric Tillman",team:"CLE",pos:"WR",bye:11,tier:"Tier 7",adp:154.5},
  {id:131,name:"Elijah Mitchell",team:"LAC",pos:"RB",bye:7,tier:"Tier 7",adp:156.0},
  {id:132,name:"Tyler Allgeier",team:"ARI",pos:"RB",bye:14,tier:"Tier 7",adp:157.5},
  {id:133,name:"Ray Davis",team:"BUF",pos:"RB",bye:7,tier:"Tier 7",adp:159.0},
  {id:134,name:"Terrace Ferguson",team:"WAS",pos:"TE",bye:7,tier:"Tier 7",adp:160.5},
  {id:135,name:"Braelon Allen",team:"NYJ",pos:"RB",bye:13,tier:"Tier 7",adp:162.0},
  {id:136,name:"Adam Thielen",team:"CAR",pos:"WR",bye:5,tier:"Tier 7",adp:163.5},
  {id:137,name:"Chigoziem Okonkwo",team:"TEN",pos:"TE",bye:9,tier:"Tier 7",adp:165.0},
  {id:138,name:"Darnell Mooney",team:"NYG",pos:"WR",bye:8,tier:"Tier 7",adp:166.5},
  {id:139,name:"Jerry Jeudy",team:"CLE",pos:"WR",bye:11,tier:"Tier 7",adp:168.0},
  {id:140,name:"Chris Rodriguez Jr.",team:"JAX",pos:"RB",bye:7,tier:"Tier 7",adp:169.5},
  {id:141,name:"Tyrone Tracy Jr.",team:"NYG",pos:"RB",bye:8,tier:"Tier 7",adp:171.0},
  {id:142,name:"Demarcus Robinson",team:"LAR",pos:"WR",bye:11,tier:"Tier 7",adp:172.5},
  {id:143,name:"Keenan Allen",team:"CHI",pos:"WR",bye:10,tier:"Tier 7",adp:174.0},
  {id:144,name:"Dalton Kincaid",team:"BUF",pos:"TE",bye:7,tier:"Tier 7",adp:175.5},
  {id:145,name:"Gus Edwards",team:"LAC",pos:"RB",bye:7,tier:"Tier 7",adp:177.0},
  {id:146,name:"Justice Hill",team:"BAL",pos:"RB",bye:13,tier:"Tier 7",adp:178.5},
  {id:147,name:"Isiah Pacheco",team:"KC",pos:"RB",bye:5,tier:"Tier 7",adp:180.0},
  {id:148,name:"Bryce Young",team:"CAR",pos:"QB",bye:5,tier:"Tier 7",adp:181.5},
  {id:149,name:"Rashod Bateman",team:"BAL",pos:"WR",bye:13,tier:"Tier 7",adp:183.0},
  {id:150,name:"Raheem Mostert",team:"MIA",pos:"RB",bye:6,tier:"Tier 7",adp:184.5},
  {id:151,name:"Zack Moss",team:"CIN",pos:"RB",bye:6,tier:"Tier 7",adp:186.0},
  {id:152,name:"Jerome Ford",team:"CLE",pos:"RB",bye:11,tier:"Tier 7",adp:187.5},
  {id:153,name:"Kendre Miller",team:"NO",pos:"RB",bye:8,tier:"Tier 7",adp:189.0},
  {id:154,name:"Jacoby Brissett",team:"ARI",pos:"QB",bye:14,tier:"Tier 7",adp:190.5},
  {id:155,name:"Geno Smith",team:"NYJ",pos:"QB",bye:13,tier:"Tier 7",adp:192.0},
  {id:156,name:"Craig Reynolds",team:"DET",pos:"RB",bye:6,tier:"Tier 7",adp:193.5},
  {id:157,name:"Jake Tonges",team:"SF",pos:"TE",bye:8,tier:"Tier 7",adp:195.0},
  // Kickers (20 deep)
  {id:158,name:"Brandon Aubrey",team:"DAL",pos:"K",bye:14,tier:"K1",adp:200.0},
  {id:159,name:"Cameron Dicker",team:"LAC",pos:"K",bye:7,tier:"K2",adp:202.0},
  {id:160,name:"Eddy Pineiro",team:"SF",pos:"K",bye:8,tier:"K3",adp:204.0},
  {id:161,name:"Harrison Mevis",team:"LAR",pos:"K",bye:11,tier:"K4",adp:206.0},
  {id:162,name:"Ka'imi Fairbairn",team:"HOU",pos:"K",bye:8,tier:"K5",adp:208.0},
  {id:163,name:"Cam Little",team:"JAX",pos:"K",bye:7,tier:"K6",adp:210.0},
  {id:164,name:"Jason Myers",team:"SEA",pos:"K",bye:11,tier:"K7",adp:212.0},
  {id:165,name:"Evan McPherson",team:"CIN",pos:"K",bye:6,tier:"K8",adp:214.0},
  {id:166,name:"Harrison Butker",team:"KC",pos:"K",bye:5,tier:"K9",adp:216.0},
  {id:167,name:"Jake Bates",team:"DET",pos:"K",bye:6,tier:"K10",adp:218.0},
  {id:168,name:"Andy Borregales",team:"NE",pos:"K",bye:11,tier:"K11",adp:220.0},
  {id:169,name:"Tyler Loop",team:"BAL",pos:"K",bye:13,tier:"K12",adp:222.0},
  {id:170,name:"Chris Boswell",team:"PIT",pos:"K",bye:9,tier:"K13",adp:224.0},
  {id:171,name:"Cairo Santos",team:"CHI",pos:"K",bye:10,tier:"K14",adp:226.0},
  {id:172,name:"Chase McLaughlin",team:"TB",pos:"K",bye:10,tier:"K15",adp:228.0},
  {id:173,name:"Wil Lutz",team:"DEN",pos:"K",bye:10,tier:"K16",adp:230.0},
  {id:174,name:"Tyler Bass",team:"BUF",pos:"K",bye:7,tier:"K17",adp:232.0},
  {id:175,name:"Charlie Smyth",team:"NO",pos:"K",bye:8,tier:"K18",adp:234.0},
  {id:176,name:"Trey Smack",team:"GB",pos:"K",bye:11,tier:"K19",adp:236.0},
  {id:177,name:"Will Reichard",team:"MIN",pos:"K",bye:6,tier:"K20",adp:238.0},
  // DEF (20 deep)
  {id:178,name:"Seattle DEF",team:"SEA",pos:"DEF",bye:11,tier:"DEF1",adp:100.0},
  {id:179,name:"Houston DEF",team:"HOU",pos:"DEF",bye:8,tier:"DEF2",adp:105.0},
  {id:180,name:"Denver DEF",team:"DEN",pos:"DEF",bye:10,tier:"DEF3",adp:108.0},
  {id:181,name:"Los Angeles Rams DEF",team:"LAR",pos:"DEF",bye:11,tier:"DEF4",adp:112.0},
  {id:182,name:"Pittsburgh DEF",team:"PIT",pos:"DEF",bye:9,tier:"DEF5",adp:115.0},
  {id:183,name:"Los Angeles Chargers DEF",team:"LAC",pos:"DEF",bye:7,tier:"DEF6",adp:118.0},
  {id:184,name:"Baltimore DEF",team:"BAL",pos:"DEF",bye:13,tier:"DEF7",adp:120.0},
  {id:185,name:"Buffalo DEF",team:"BUF",pos:"DEF",bye:7,tier:"DEF8",adp:123.0},
  {id:186,name:"Jacksonville DEF",team:"JAX",pos:"DEF",bye:7,tier:"DEF9",adp:126.0},
  {id:187,name:"Chicago DEF",team:"CHI",pos:"DEF",bye:10,tier:"DEF10",adp:128.0},
  {id:188,name:"Cleveland DEF",team:"CLE",pos:"DEF",bye:11,tier:"DEF11",adp:130.0},
  {id:189,name:"San Francisco DEF",team:"SF",pos:"DEF",bye:8,tier:"DEF12",adp:133.0},
  {id:190,name:"Philadelphia DEF",team:"PHI",pos:"DEF",bye:10,tier:"DEF13",adp:136.0},
  {id:191,name:"Dallas DEF",team:"DAL",pos:"DEF",bye:14,tier:"DEF14",adp:139.0},
  {id:192,name:"Minnesota DEF",team:"MIN",pos:"DEF",bye:6,tier:"DEF15",adp:142.0},
  {id:193,name:"New England DEF",team:"NE",pos:"DEF",bye:11,tier:"DEF16",adp:145.0},
  {id:194,name:"Detroit DEF",team:"DET",pos:"DEF",bye:6,tier:"DEF17",adp:148.0},
  {id:195,name:"Green Bay DEF",team:"GB",pos:"DEF",bye:11,tier:"DEF18",adp:151.0},
  {id:196,name:"Kansas City DEF",team:"KC",pos:"DEF",bye:5,tier:"DEF19",adp:154.0},
  {id:197,name:"Tampa Bay DEF",team:"TB",pos:"DEF",bye:10,tier:"DEF20",adp:157.0},
  // Deep offensive sleepers
  {id:198,name:"Marvin Mims Jr.",team:"DEN",pos:"WR",bye:10,tier:"Tier 7",adp:196.0},
  {id:199,name:"Tank Bigsby",team:"JAX",pos:"RB",bye:7,tier:"Tier 7",adp:197.0},
  {id:200,name:"Ty Johnson",team:"BUF",pos:"RB",bye:7,tier:"Tier 7",adp:198.0},
  {id:201,name:"Tre Tucker",team:"LV",pos:"WR",bye:13,tier:"Tier 7",adp:199.0},
  {id:202,name:"Jermaine Burton",team:"CIN",pos:"WR",bye:6,tier:"Tier 7",adp:200.0},
  {id:203,name:"Kayshon Boutte",team:"NE",pos:"WR",bye:11,tier:"Tier 7",adp:201.0},
  {id:204,name:"Ty Davis-Price",team:"SF",pos:"RB",bye:8,tier:"Tier 7",adp:202.0},
  {id:205,name:"Cade Otton",team:"TB",pos:"TE",bye:10,tier:"Tier 7",adp:203.0},
  {id:206,name:"Carson Beck",team:"ARI",pos:"QB",bye:14,tier:"Tier 7",adp:204.0},
  {id:207,name:"Fernando Mendoza",team:"LV",pos:"QB",bye:13,tier:"Tier 7",adp:205.0},
  {id:208,name:"Tylan Wallace",team:"BAL",pos:"WR",bye:13,tier:"Tier 7",adp:206.0},
  {id:209,name:"Devin Singletary",team:"NYG",pos:"RB",bye:8,tier:"Tier 7",adp:207.0},
  {id:210,name:"Noah Gray",team:"KC",pos:"TE",bye:5,tier:"Tier 7",adp:208.0},
  {id:211,name:"Rashid Shaheed",team:"NO",pos:"WR",bye:8,tier:"Tier 7",adp:209.0},
  {id:212,name:"Ty Chandler",team:"MIN",pos:"RB",bye:6,tier:"Tier 7",adp:210.0},
  {id:213,name:"Adonai Mitchell",team:"IND",pos:"WR",bye:13,tier:"Tier 7",adp:211.0},
  {id:214,name:"Nick Westbrook-Ikhine",team:"TEN",pos:"WR",bye:9,tier:"Tier 7",adp:212.0},
  {id:215,name:"Keaton Mitchell",team:"BAL",pos:"RB",bye:13,tier:"Tier 7",adp:213.0},
  {id:216,name:"Ty Simpson",team:"LAR",pos:"QB",bye:11,tier:"Tier 7",adp:214.0},
  {id:217,name:"Pat Freiermuth",team:"PIT",pos:"TE",bye:9,tier:"Tier 7",adp:215.0},
];

// Position colors
const POS_COLORS = {
  QB: { bg: "#fce4ec", text: "#c62828", border: "#ef9a9a" },
  RB: { bg: "#e3f2fd", text: "#1565c0", border: "#90caf9" },
  WR: { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  TE: { bg: "#fff3e0", text: "#e65100", border: "#ffcc80" },
  K:  { bg: "#f3e5f5", text: "#6a1b9a", border: "#ce93d8" },
  DEF:{ bg: "#eceff1", text: "#37474f", border: "#b0bec5" },
  LB: { bg: "#fce4ec", text: "#880e4f", border: "#f48fb1" },
  DL: { bg: "#e8eaf6", text: "#283593", border: "#9fa8da" },
  DB: { bg: "#e0f7fa", text: "#00695c", border: "#80cbc4" },
};

const TABS = ["Overall", "QB", "RB", "WR", "TE", "K", "DEF", "My Team", "Advisor"];
const IDP_POSITIONS = [];

// ── Injury Status (as of Sep 4 2026) ────────────────────────────────────
const INJURIES = {
  "Ja'Marr Chase": { status: "Q", note: "Hyperextended knee Aug 25 — expected Week 1 but limited practice" },
  "Jeremiyah Love": { status: "Q", note: "High ankle sprain — Week 1 status uncertain" },
  "Ashton Jeanty": { status: "Q", note: "Ankle sprain — coach 'optimistic' for Week 1, Mike Washington Jr. insurance" },
  "Malik Nabers": { status: "Q", note: "ACL rehab + cyclops lesion surgery — Week 1 return unlikely at full speed" },
  "George Kittle": { status: "Q", note: "Achilles tear rehab — trending toward Week 1 in Australia" },
  "Zay Flowers": { status: "Q", note: "Quad contusion — day-to-day, no official designation" },
  "Tyler Warren": { status: "Q", note: "Groin — continued limitations in practice" },
  "Luther Burden III": { status: "Q", note: "Groin — ruled out of preseason, questionable Week 1" },
  "Patrick Mahomes": { status: "Q", note: "Torn ACL/LCL rehab — targeting Week 1 but workload may be managed" },
  "Mike Evans": { status: "Q", note: "Quad injuries + groin strain — expected to play Week 1" },
  "Puka Nacua": { status: "M", note: "Groin — team not concerned, monitor only" },
  "Rashee Rice": { status: "M", note: "Cleared to practice — but averages 11 missed games/yr past 2 seasons" },
  "Breece Hall": { status: "M", note: "Left practice with injury — monitor" },
  "TreVeyon Henderson": { status: "M", note: "Ankle — expected to play Week 1" },
  "Josh Jacobs": { status: "S", note: "Commissioner Exempt List — no return timeline" },
  "Zach Charbonnet": { status: "O", note: "Reserve PUP — out minimum 4 games" },
  "Makai Lemon": { status: "M", note: "Hamstring — returned to full practice" },
  "Brock Purdy": { status: "Q", note: "Turf toe — ruled out Week 2 already, may miss 2-5 weeks" },
};

// status: O=Out, Q=Questionable, M=Monitor, S=Suspended/Exempt

function getInjuryBadge(name) {
  const inj = INJURIES[name];
  if (!inj) return null;
  const colors = {
    O: { bg: "#f85149", text: "#fff" },
    Q: { bg: "#d29922", text: "#000" },
    M: { bg: "#388bfd", text: "#fff" },
    S: { bg: "#f85149", text: "#fff" },
  };
  const labels = { O: "OUT", Q: "Q", M: "MON", S: "EXM" };
  const c = colors[inj.status];
  return { label: labels[inj.status], color: c, note: inj.note };
}

// ── Bye Week Stacking Check (weeks 1-10 only) ──────────────────────────
function checkByeConflict(myTeam, candidate) {
  if (candidate.bye > 10) return null;
  const sameBye = myTeam.filter(p =>
    p.bye === candidate.bye &&
    !["K", "DEF", "LB", "DL", "DB"].includes(p.pos)
  );
  if (sameBye.length >= 2) {
    return {
      bye: candidate.bye,
      count: sameBye.length + 1,
      players: [...sameBye.map(p => p.name), candidate.name],
    };
  }
  return null;
}

// ── Handcuff Map ────────────────────────────────────────────────────────
const HANDCUFFS = {
  "Bijan Robinson": "Brian Robinson Jr.",
  "Jahmyr Gibbs": "Craig Reynolds",
  "Jonathan Taylor": "Trey Sermon",
  "De'Von Achane": "Raheem Mostert",
  "Christian McCaffrey": "Jordan Mason",
  "James Cook III": "Ray Davis",
  "Saquon Barkley": "Kenny Gainwell",
  "Chase Brown": "Zack Moss",
  "Omarion Hampton": "Gus Edwards",
  "Derrick Henry": "Justice Hill",
  "Kenneth Walker": "Isiah Pacheco",
  "Ashton Jeanty": "Mike Washington Jr.",
  "Jeremiyah Love": "Tyler Allgeier",
  "Javonte Williams": "Rico Dowdle",
  "Kyren Williams": "Blake Corum",
  "Breece Hall": "Braelon Allen",
  "Travis Etienne Jr.": "Kendre Miller",
  "D'Andre Swift": "Kyle Monangai",
  "Cam Skattebo": "Tyrone Tracy Jr.",
  "Bucky Irving": "Kenny Gainwell",
  "Quinshon Judkins": "Jerome Ford",
  "Bhayshul Tuten": "Chris Rodriguez Jr.",
  "Jadarian Price": "Zach Charbonnet",
};

// ── Steal Indicator (!  !! !!!) ─────────────────────────────────────────
function getStealLevel(player, currentAvailableRank) {
  const expectedRank = player.adp;
  const drop = currentAvailableRank - expectedRank;
  if (drop >= 25) return { level: 3, label: "!!!", color: "#f0883e" };
  if (drop >= 15) return { level: 2, label: "!!", color: "#d29922" };
  if (drop >= 7) return { level: 1, label: "!", color: "#3fb950" };
  return null;
}

// ── Roster Construction Targets ─────────────────────────────────────────
const ROSTER_TARGETS = {
  3:  { QB: 0, RB: 1, WR: "0-1", TE: 0 },
  5:  { QB: 0, RB: 2, WR: "1-2", TE: "0-1" },
  8:  { QB: 1, RB: "2-3", WR: "2-3", TE: 1 },
  10: { QB: 1, RB: 3, WR: "3-4", TE: 1 },
  13: { QB: "1-2", RB: "4-5", WR: "4-5", TE: 1 },
};

// ── Picks Until Next Turn Calculator ────────────────────────────────────
function getPicksUntilNext(round, struckCount) {
  const slot = 3;
  const isOdd = round % 2 === 1;
  const myPick = isOdd ? (round - 1) * 12 + slot : round * 12 - slot + 1;
  const nextRound = round + 1;
  if (nextRound > 18) return null;
  const nextIsOdd = nextRound % 2 === 1;
  const nextPick = nextIsOdd ? (nextRound - 1) * 12 + slot : nextRound * 12 - slot + 1;
  return nextPick - myPick - 1;
}

// ── VOR / Positional Drop-off ───────────────────────────────────────────
function getDropoff(available, pos) {
  const posPlayers = available.filter(p => p.pos === pos);
  if (posPlayers.length < 2) return null;
  const gap = posPlayers[1].adp - posPlayers[0].adp;
  if (gap >= 8) return { top: posPlayers[0].name, gap: gap.toFixed(0), severity: "high" };
  if (gap >= 4) return { top: posPlayers[0].name, gap: gap.toFixed(0), severity: "mid" };
  return null;
}

// ── Strategy Engine ──────────────────────────────────────────────────────
function getRecommendation(myTeam, available, round) {
  const hasPos = (pos) => myTeam.filter(p => p.pos === pos).length;
  const rbs = hasPos("RB"), wrs = hasPos("WR"), qbs = hasPos("QB"), tes = hasPos("TE");
  const topAvail = (pos, n=5) => available.filter(p => p.pos === pos).slice(0, n);

  // Round 1 (pick 3)
  if (round === 1) {
    const bijan = available.find(p => p.name === "Bijan Robinson");
    if (bijan) return { pick: bijan, reason: "Bijan is available at 3. Elite RB in full PPR — his pass-catching neutralizes loaded-box risk. Take him per your plan." };
    const jsn = available.find(p => p.name === "Jaxon Smith-Njigba");
    if (jsn) return { pick: jsn, reason: "Robinson gone. JSN is your fallback — elite PPR WR floor. Pivot to RB-RB at picks 22/27." };
    const best = available[0];
    return { pick: best, reason: `Both Robinson and JSN gone (unusual). Best available is ${best.name} — take the value.` };
  }

  // Rounds 2-3 (picks 22, 27)
  if (round === 2 || round === 3) {
    const hasJSN = myTeam.some(p => p.name === "Jaxon Smith-Njigba");
    const hasBijan = myTeam.some(p => p.name === "Bijan Robinson");

    if (hasBijan && round === 2) {
      const bestRB = topAvail("RB")[0];
      const mcbride = available.find(p => p.name === "Trey McBride");
      if (bestRB) return { pick: bestRB, reason: `You have Bijan. Lock in RB depth with ${bestRB.name}. McBride is also an option at your next pick.` };
    }
    if (hasBijan && round === 3) {
      const mcbride = available.find(p => p.name === "Trey McBride");
      const bestRB = topAvail("RB")[0];
      if (rbs < 2 && bestRB) return { pick: bestRB, reason: `Only ${rbs} RB so far. Grab ${bestRB.name} for RB2 depth before the position thins.` };
      if (mcbride) return { pick: mcbride, reason: "McBride is the TE1 with massive PPR upside. With Bijan + an RB2 locked, this is the spot." };
      if (bestRB) return { pick: bestRB, reason: `RB depth still thin. ${bestRB.name} is the best available.` };
    }
    if (hasJSN) {
      const bestRB = topAvail("RB")[0];
      if (bestRB) return { pick: bestRB, reason: `JSN plan: RB-RB at picks 22/27 without deviation. Take ${bestRB.name}.` };
    }
    // Fallback
    const bestRB = topAvail("RB")[0];
    if (bestRB && rbs < 2) return { pick: bestRB, reason: `You need RB depth. ${bestRB.name} is the best available.` };
    const best = available[0];
    return { pick: best, reason: `Best available value: ${best.name}.` };
  }

  // Rounds 4-6: WR priority
  if (round >= 4 && round <= 6) {
    if (wrs < 2) {
      const bestWR = topAvail("WR")[0];
      if (bestWR) return { pick: bestWR, reason: `WR round. ${bestWR.name} is the top WR available — build your receiver corps.` };
    }
    if (tes === 0) {
      const mcbride = available.find(p => p.name === "Trey McBride");
      const bowers = available.find(p => p.name === "Brock Bowers");
      const bestTE = topAvail("TE")[0];
      if (mcbride) return { pick: mcbride, reason: "McBride still on the board — grab the TE1 before it's too late." };
      if (bowers) return { pick: bowers, reason: "Bowers is a steal here. Lock in your TE." };
      if (bestTE && round >= 5) return { pick: bestTE, reason: `TE getting thin. ${bestTE.name} is the best option.` };
    }
    const bestWR = topAvail("WR")[0];
    const bestAvail = available[0];
    if (bestWR && bestWR.adp <= bestAvail.adp + 10) return { pick: bestWR, reason: `Continue building WR depth with ${bestWR.name}.` };
    return { pick: bestAvail, reason: `Best available value: ${bestAvail.name} (${bestAvail.pos}).` };
  }

  // Rounds 6-8: QB window
  if (round >= 6 && round <= 8 && qbs === 0) {
    const bestQB = topAvail("QB")[0];
    if (bestQB) return { pick: bestQB, reason: `QB window (rounds 6-8). ${bestQB.name} is your best option. Don't repeat the Josh Allen mistake — but do get your QB1 in this range.` };
  }

  // Rounds 9+: Fill gaps, K, DEF late
  if (round >= 9) {
    if (qbs === 0) {
      const bestQB = topAvail("QB")[0];
      if (bestQB) return { pick: bestQB, reason: `You still need a QB. ${bestQB.name} is the pick.` };
    }
    if (tes === 0) {
      const bestTE = topAvail("TE")[0];
      if (bestTE) return { pick: bestTE, reason: `No TE yet. Grab ${bestTE.name}.` };
    }
    if (rbs < 4) {
      const bestRB = topAvail("RB")[0];
      if (bestRB) return { pick: bestRB, reason: `RB depth pick: ${bestRB.name}.` };
    }
    if (wrs < 4) {
      const bestWR = topAvail("WR")[0];
      if (bestWR) return { pick: bestWR, reason: `WR depth: ${bestWR.name}.` };
    }
  }

  // Deep rounds: K, DEF
  if (round >= 12) {
    const needs = [];
    if (!myTeam.some(p => p.pos === "K")) needs.push("K");
    if (!myTeam.some(p => p.pos === "DEF")) needs.push("DEF");
    if (needs.length > 0) {
      const pos = needs[0];
      const searchPos = pos === "IDP" ? IDP_POSITIONS : [pos];
      const best = available.filter(p => searchPos.includes(p.pos))[0];
      if (best) return { pick: best, reason: `Fill your ${pos} slot: ${best.name}.` };
    }
  }

  const best = available[0];
  return { pick: best, reason: `Best available: ${best.name} (${best.pos}).` };
}

// ── Components ───────────────────────────────────────────────────────────
function PosBadge({ pos }) {
  const c = POS_COLORS[pos] || { bg: "#eee", text: "#333", border: "#ccc" };
  return (
    <span style={{
      display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 11,
      fontWeight: 700, background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      minWidth: 28, textAlign: "center", letterSpacing: 0.5
    }}>{pos}</span>
  );
}

function PlayerRow({ player, rank, struck, onToggle, compact, stealLevel }) {
  const inj = getInjuryBadge(player.name);
  const hc = HANDCUFFS[player.name];
  return (
    <div
      onClick={() => onToggle(player.id)}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: compact ? "5px 10px" : "7px 12px",
        cursor: "pointer", borderBottom: "1px solid var(--border)",
        background: struck ? "var(--struck-bg)" : stealLevel ? `${stealLevel.color}08` : "transparent",
        opacity: struck ? 0.45 : 1,
        textDecoration: struck ? "line-through" : "none",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ width: 32, fontSize: 12, color: "var(--dim)", textAlign: "right", flexShrink: 0, textDecoration: "none" }}>
        {rank}
      </span>
      <PosBadge pos={player.pos} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
        {player.name}
        {inj && (
          <span title={inj.note} style={{
            display: "inline-block", marginLeft: 4, padding: "0 4px", borderRadius: 3,
            fontSize: 9, fontWeight: 800, background: inj.color.bg, color: inj.color.text,
            verticalAlign: "middle", lineHeight: "14px", cursor: "help",
          }}>{inj.label}</span>
        )}
        {stealLevel && !struck && (
          <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 900, color: stealLevel.color, letterSpacing: -1 }}>{stealLevel.label}</span>
        )}
      </span>
      <span style={{ fontSize: 11, color: "var(--dim)", width: 36, textAlign: "center" }}>{player.team}</span>
      <span style={{ fontSize: 11, color: "var(--dim)", width: 30, textAlign: "center" }}>{player.bye}</span>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────
export default function DraftBoard() {
  const [struckIds, setStruckIds] = useState(new Set());
  const [myTeam, setMyTeam] = useState([]);
  const [activeTab, setActiveTab] = useState("Overall");
  const [round, setRound] = useState(1);
  const [search, setSearch] = useState("");
  const [hideStruck, setHideStruck] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = { current: null };

  const toggle = useCallback((id) => {
    setStruckIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const addToTeam = useCallback((player) => {
    setMyTeam(prev => {
      if (prev.some(p => p.id === player.id)) return prev;
      return [...prev, player];
    });
    setStruckIds(prev => { const next = new Set(prev); next.add(player.id); return next; });
  }, []);

  const removeFromTeam = useCallback((id) => {
    setMyTeam(prev => prev.filter(p => p.id !== id));
    setStruckIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const snakePick = useMemo(() => {
    const slot = 3;
    const picks = [];
    for (let r = 1; r <= 18; r++) {
      const isOdd = r % 2 === 1;
      picks.push({ round: r, pick: isOdd ? (r - 1) * 12 + slot : r * 12 - slot + 1 });
    }
    return picks;
  }, []);

  const sorted = useMemo(() => [...PLAYERS].sort((a, b) => a.adp - b.adp), []);
  const available = useMemo(() => sorted.filter(p => !struckIds.has(p.id)), [sorted, struckIds]);

  const filteredPlayers = useMemo(() => {
    let list = sorted;
    if (activeTab === "IDP") list = sorted.filter(p => IDP_POSITIONS.includes(p.pos));
    else if (activeTab !== "Overall" && activeTab !== "My Team" && activeTab !== "Advisor") {
      list = sorted.filter(p => p.pos === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    }
    if (hideStruck) list = list.filter(p => !struckIds.has(p.id));
    return list;
  }, [sorted, activeTab, search, struckIds, hideStruck]);

  const rec = useMemo(() => getRecommendation(myTeam, available, round), [myTeam, available, round]);

  const currentPick = snakePick.find(p => p.round === round);

  const sendChat = useCallback(async (userMsg) => {
    if (!userMsg.trim()) return;
    const newMsgs = [...chatMessages, { role: "user", text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);

    const rosterSummary = myTeam.length > 0
      ? myTeam.map(p => `${p.name} (${p.pos}, ${p.team})`).join(", ")
      : "Empty";
    const topAvail = available.slice(0, 20).map((p, i) => `${i+1}. ${p.name} (${p.pos}, ${p.team}, Tier: ${p.tier})`).join("\n");
    const posCount = pos => myTeam.filter(p => p.pos === pos).length;
    const curPick = snakePick.find(p => p.round === round);

    const systemPrompt = `You are Eli's fantasy football draft advisor embedded in his live draft board. Be direct, opinionated, and concise. Challenge weak logic but confirm good calls fast.

LEAGUE: 12-team snake draft, ESPN, Full PPR, 6pt passing TDs, pick 3 overall.

ELI'S STRATEGY:
- If Bijan Robinson available at pick 3: Take Robinson, then RB at pick 22, RB or Trey McBride at 27, WR rounds 4-6, QB rounds 6-8
- If Robinson gone at pick 3: Take Jaxon Smith-Njigba, then RB-RB at picks 22/27 without deviation, McBride + WR mid-rounds
- Puka Nacua removed from consideration (off-field + QB durability concerns)
- QB deprioritized to rounds 6-8 (learned from drafting Josh Allen too early last year)
- Tiered kicker scoring (FG tiers: 3/4/5/6 pts) makes kicker streaming more impactful

CURRENT STATE:
- Round: ${round}, Pick #${curPick?.pick || "?"}
- Current recommendation: ${rec.pick ? `${rec.pick.name} (${rec.pick.pos}) — ${rec.reason}` : "None"}
- My roster: ${rosterSummary}
- Position counts: QB:${posCount("QB")} RB:${posCount("RB")} WR:${posCount("WR")} TE:${posCount("TE")} K:${posCount("K")} DEF:${posCount("DEF")}
- Top 20 available:
${topAvail}

Keep responses under 150 words. No bullet points. Be a thought partner, not a yes-man.`;

    const apiMessages = [];
    for (const m of newMsgs) {
      apiMessages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Couldn't get a response. Try again.";
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Connection error — try again." }]);
    }
    setChatLoading(false);
  }, [chatMessages, myTeam, available, round, rec, snakePick]);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 520, margin: "0 auto", minHeight: "100vh",
      background: "var(--bg)", color: "var(--fg)",
      "--bg": "#0d1117", "--fg": "#e6edf3", "--dim": "#7d8590",
      "--border": "#21262d", "--card": "#161b22", "--accent": "#58a6ff",
      "--struck-bg": "#161b2280", "--green": "#3fb950", "--red": "#f85149",
      "--tab-bg": "#21262d", "--tab-active": "#58a6ff",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 12px 8px", borderBottom: "2px solid var(--accent)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--accent)" }}>Draft Board 2026</h1>
            <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2 }}>12-Team Snake · Pick 3 · Full PPR</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--dim)" }}>Round</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <button onClick={() => setRound(r => Math.max(1, r - 1))}
                style={{ background: "var(--tab-bg)", border: "none", color: "var(--fg)", borderRadius: 4, width: 24, height: 24, cursor: "pointer", fontSize: 14 }}>−</button>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", minWidth: 24, textAlign: "center" }}>{round}</span>
              <button onClick={() => setRound(r => Math.min(18, r + 1))}
                style={{ background: "var(--tab-bg)", border: "none", color: "var(--fg)", borderRadius: 4, width: 24, height: 24, cursor: "pointer", fontSize: 14 }}>+</button>
            </div>
            {currentPick && <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 1 }}>Pick #{currentPick.pick}</div>}
          </div>
        </div>

        {/* Team count strip + picks until next + roster targets */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 11, color: "var(--dim)", flexWrap: "wrap", alignItems: "center" }}>
          {["QB","RB","WR","TE","K","DEF"].map(pos => {
            const posFilter = pos === "IDP" ? IDP_POSITIONS : [pos];
            const count = myTeam.filter(p => posFilter.includes(p.pos)).length;
            return (
              <span key={pos} style={{ color: count > 0 ? "var(--green)" : "var(--dim)" }}>
                {pos}:{count}
              </span>
            );
          })}
          <span style={{ color: "var(--accent)", fontWeight: 600, marginLeft: "auto" }}>
            {(() => {
              const pu = getPicksUntilNext(round, struckIds.size);
              return pu !== null ? `${pu} picks til next` : "Last round";
            })()}
          </span>
        </div>
        {/* Roster construction target */}
        {(() => {
          const targetRound = Object.keys(ROSTER_TARGETS).map(Number).sort((a,b)=>a-b).find(r => r >= round);
          if (!targetRound) return null;
          const t = ROSTER_TARGETS[targetRound];
          return (
            <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 4, opacity: 0.7 }}>
              Target by Rd {targetRound}: RB {t.RB} · WR {t.WR} · TE {t.TE} · QB {t.QB}
            </div>
          );
        })()}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 2, padding: "6px 8px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: "5px 10px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              background: activeTab === tab ? "var(--tab-active)" : "transparent",
              color: activeTab === tab ? "#fff" : "var(--dim)",
              transition: "all 0.15s",
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Search + filter */}
      {!["My Team", "Advisor"].includes(activeTab) && (
        <div style={{ display: "flex", gap: 8, padding: "8px 12px", alignItems: "center" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            style={{
              flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--fg)", fontSize: 13, outline: "none",
            }}
          />
          <label style={{ fontSize: 11, color: "var(--dim)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={hideStruck} onChange={e => setHideStruck(e.target.checked)} />
            Hide struck
          </label>
        </div>
      )}

      {/* Content */}
      {activeTab === "Advisor" ? (
        <div style={{ padding: 16 }}>
          <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--accent)", padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
              Round {round} Recommendation — Pick #{currentPick?.pick}
            </div>
            {rec.pick ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <PosBadge pos={rec.pick.pos} />
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{rec.pick.name}</span>
                  <span style={{ fontSize: 12, color: "var(--dim)" }}>{rec.pick.team}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.5, margin: "10px 0 12px" }}>{rec.reason}</p>

                {/* Injury warning */}
                {(() => { const inj = INJURIES[rec.pick.name]; return inj ? (
                  <div style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 8, fontSize: 12, lineHeight: 1.4,
                    background: inj.status === "O" || inj.status === "S" ? "#f8514920" : "#d2992220",
                    border: `1px solid ${inj.status === "O" || inj.status === "S" ? "#f85149" : "#d29922"}`,
                    color: inj.status === "O" || inj.status === "S" ? "#f85149" : "#d29922",
                  }}>
                    <span style={{ fontWeight: 700 }}>{inj.status === "O" ? "OUT" : inj.status === "S" ? "EXEMPT" : "INJURY"}</span> {inj.note}
                  </div>
                ) : null; })()}

                {/* Bye week stacking warning */}
                {(() => { const bw = checkByeConflict(myTeam, rec.pick); return bw ? (
                  <div style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 8, fontSize: 12, lineHeight: 1.4,
                    background: "#d2992220", border: "1px solid #d29922", color: "#d29922",
                  }}>
                    <span style={{ fontWeight: 700 }}>BYE STACK</span> Drafting {rec.pick.name} gives you {bw.count} starters on bye week {bw.bye} ({bw.players.join(", ")})
                  </div>
                ) : null; })()}

                <button onClick={() => { addToTeam(rec.pick); setRound(r => Math.min(18, r + 1)); }}
                  style={{
                    background: "var(--green)", color: "#000", border: "none", borderRadius: 6,
                    padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%"
                  }}>
                  Draft {rec.pick.name} → Round {Math.min(18, round + 1)}
                </button>
              </>
            ) : <p style={{ color: "var(--dim)" }}>No players available.</p>}
          </div>

          {/* VOR Drop-off Alerts */}
          {(() => {
            const drops = ["RB","WR","TE","QB"].map(pos => ({ pos, ...getDropoff(available, pos) })).filter(d => d.top);
            if (drops.length === 0) return null;
            return (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", marginBottom: 6 }}>Positional drop-offs</div>
                {drops.map(d => (
                  <div key={d.pos} style={{
                    padding: "5px 10px", borderRadius: 6, marginBottom: 3, fontSize: 12,
                    background: d.severity === "high" ? "#f8514915" : "#d2992215",
                    border: `1px solid ${d.severity === "high" ? "#f8514940" : "#d2992240"}`,
                    color: d.severity === "high" ? "#f85149" : "#d29922",
                  }}>
                    <span style={{ fontWeight: 700 }}>{d.pos}:</span> {d.top} is {d.gap}+ spots ahead of {d.pos}2 — tier cliff after him
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Handcuff reminder */}
          {(() => {
            const cuffs = myTeam.filter(p => HANDCUFFS[p.name]).map(p => ({
              starter: p.name,
              cuff: HANDCUFFS[p.name],
              available: available.some(a => a.name === HANDCUFFS[p.name]),
            })).filter(c => c.available);
            if (cuffs.length === 0 || round < 9) return null;
            return (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", marginBottom: 6 }}>Handcuff targets</div>
                {cuffs.map(c => (
                  <div key={c.starter} style={{
                    padding: "5px 10px", borderRadius: 6, marginBottom: 3, fontSize: 12,
                    background: "#388bfd15", border: "1px solid #388bfd40", color: "#388bfd",
                  }}>
                    <span style={{ fontWeight: 700 }}>{c.cuff}</span> — insurance for your {c.starter}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Quick alternatives */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", marginBottom: 8 }}>Also consider:</div>
          {available.slice(0, 5).map((p, i) => {
            const pinj = getInjuryBadge(p.name);
            const psteal = getStealLevel(p, struckIds.size + i + 1);
            return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
              background: psteal ? `${psteal.color}08` : "var(--card)", borderRadius: 6, marginBottom: 4, cursor: "pointer",
              border: `1px solid ${psteal ? psteal.color + "30" : "var(--border)"}`
            }} onClick={() => { addToTeam(p); setRound(r => Math.min(18, r + 1)); }}>
              <span style={{ width: 20, fontSize: 11, color: "var(--dim)" }}>{i + 1}</span>
              <PosBadge pos={p.pos} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                {p.name}
                {pinj && <span title={pinj.note} style={{ display: "inline-block", marginLeft: 4, padding: "0 4px", borderRadius: 3, fontSize: 9, fontWeight: 800, background: pinj.color.bg, color: pinj.color.text, verticalAlign: "middle", lineHeight: "14px" }}>{pinj.label}</span>}
                {psteal && <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 900, color: psteal.color }}>{psteal.label}</span>}
              </span>
              <span style={{ fontSize: 11, color: "var(--dim)" }}>{p.team}</span>
              <span style={{ fontSize: 11, color: "var(--green)" }}>Draft</span>
            </div>
            );
          })}

          {/* ── Chat Dialogue ── */}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>Talk it out</div>

            {/* Messages */}
            <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 8 }}>
              {chatMessages.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--dim)", padding: "8px 0", lineHeight: 1.5 }}>
                  Ask me anything — "Why not take a WR here?", "What if I grab McBride instead?", "Who's the best RB available after round 4?"
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{
                  marginBottom: 8, display: "flex", flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    padding: "8px 12px", borderRadius: 10, maxWidth: "88%", fontSize: 13, lineHeight: 1.5,
                    background: m.role === "user" ? "var(--accent)" : "var(--card)",
                    color: m.role === "user" ? "#000" : "var(--fg)",
                    border: m.role === "user" ? "none" : "1px solid var(--border)",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--dim)", fontStyle: "italic" }}>
                  Thinking...
                </div>
              )}
              <div ref={el => { chatEndRef.current = el; if (el) el.scrollIntoView({ behavior: "smooth" }); }} />
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !chatLoading) sendChat(chatInput); }}
                placeholder="Debate a pick..."
                disabled={chatLoading}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--card)", color: "var(--fg)", fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={() => sendChat(chatInput)}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
                  background: chatLoading || !chatInput.trim() ? "var(--tab-bg)" : "var(--accent)",
                  color: chatLoading || !chatInput.trim() ? "var(--dim)" : "#000",
                  cursor: chatLoading || !chatInput.trim() ? "default" : "pointer",
                }}
              >Send</button>
            </div>
          </div>
        </div>
      ) : activeTab === "My Team" ? (
        <div style={{ padding: 16 }}>
          {myTeam.length === 0 ? (
            <p style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", padding: 32 }}>
              No players drafted yet. Use the Advisor tab or click "Draft" on any player.
            </p>
          ) : (
            <>
              {["QB","RB","WR","TE","K","DEF"].map(pos => {
                const posPlayers = myTeam.filter(p => p.pos === pos);
                if (posPlayers.length === 0) return null;
                return (
                  <div key={pos} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 4, textTransform: "uppercase" }}>{pos}</div>
                    {posPlayers.map(p => (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                        background: "var(--card)", borderRadius: 6, marginBottom: 3,
                        border: "1px solid var(--border)"
                      }}>
                        <PosBadge pos={p.pos} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: "var(--dim)" }}>{p.team}</span>
                        <button onClick={() => removeFromTeam(p.id)}
                          style={{ background: "none", border: "none", color: "var(--red)", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
          {/* Column headers */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "4px 12px",
            fontSize: 10, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 0.5,
            borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 1
          }}>
            <span style={{ width: 32, textAlign: "right" }}>#</span>
            <span style={{ width: 30 }}>Pos</span>
            <span style={{ flex: 1 }}>Player</span>
            <span style={{ width: 36, textAlign: "center" }}>Team</span>
            <span style={{ width: 30, textAlign: "center" }}>Bye</span>
          </div>
          {filteredPlayers.map((p, i) => {
            const sl = !struckIds.has(p.id) ? getStealLevel(p, struckIds.size + i + 1) : null;
            return (
            <PlayerRow
              key={p.id}
              player={p}
              rank={i + 1}
              struck={struckIds.has(p.id)}
              onToggle={toggle}
              compact={activeTab === "Overall"}
              stealLevel={sl}
            />
            );
          })}
          {filteredPlayers.length === 0 && (
            <p style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", padding: 32 }}>No players match.</p>
          )}
        </div>
      )}
    </div>
  );
}

