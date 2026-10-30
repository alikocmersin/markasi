export type VehicleEngine = {
  label: string;
  powerHp: number[];
};

export type VehicleGeneration = {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  bodies: string[];
  engines: VehicleEngine[];
};

export type VehicleModel = {
  label: string;
  generations: VehicleGeneration[];
};

export type VehicleBrand = {
  label: string;
  models: VehicleModel[];
};

type EngineSeed = [label: string, ...powerHp: number[]];

function generation(
  id: string,
  label: string,
  startYear: number,
  endYear: number,
  bodies: string[],
  engines: EngineSeed[],
): VehicleGeneration {
  return {
    id,
    label,
    startYear,
    endYear,
    bodies,
    engines: engines.map(([engineLabel, ...powerHp]) => ({
      label: engineLabel,
      powerHp,
    })),
  };
}

function model(
  label: string,
  generations: VehicleGeneration[],
): VehicleModel {
  return { label, generations };
}

function brand(label: string, models: VehicleModel[]): VehicleBrand {
  return { label, models };
}

const hatch = ["Hatchback"];
const sedan = ["Sedan"];
const suv = ["SUV"];
const hatchSedan = ["Hatchback", "Sedan"];
const hatchSuv = ["Hatchback", "SUV"];

export const vehicleCatalog: VehicleBrand[] = [
  brand("Audi", [
    model("A1", [
      generation("8X", "8X · 1. nesil", 2010, 2018, hatch, [
        ["1.0 TFSI", 82, 95],
        ["1.4 TFSI", 122, 125, 150],
        ["1.6 TDI", 90, 105, 116],
      ]),
      generation("GB", "GB · 2. nesil", 2018, 2026, hatch, [
        ["25 TFSI 1.0", 95],
        ["30 TFSI 1.0", 110],
        ["35 TFSI 1.5", 150],
      ]),
    ]),
    model("A3", [
      generation("8P", "8P · 2. nesil", 2003, 2012, hatchSedan, [
        ["1.6 MPI", 102],
        ["1.4 TFSI", 125],
        ["1.6 TDI", 105],
        ["2.0 TDI", 140],
      ]),
      generation("8V", "8V · 3. nesil", 2012, 2020, hatchSedan, [
        ["1.0 TFSI", 115],
        ["1.4 TFSI", 125, 150],
        ["1.6 TDI", 110, 116],
        ["2.0 TDI", 150],
      ]),
      generation("8Y", "8Y · 4. nesil", 2020, 2026, hatchSedan, [
        ["30 TFSI 1.0", 110],
        ["35 TFSI 1.5", 150],
        ["30 TDI 2.0", 116],
        ["35 TDI 2.0", 150],
      ]),
    ]),
    model("A4", [
      generation("B7", "B7 · 3. nesil", 2004, 2008, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.6 MPI", 102],
        ["1.8T", 163],
        ["2.0 TDI", 140],
      ]),
      generation("B8", "B8 · 4. nesil", 2008, 2015, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.8 TFSI", 120, 160],
        ["2.0 TFSI", 180, 211],
        ["2.0 TDI", 143, 170],
      ]),
      generation("B9", "B9 · 5. nesil", 2015, 2024, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.4 TFSI", 150],
        ["2.0 TFSI", 190],
        ["2.0 TDI", 150, 190],
      ]),
    ]),
    model("Q3", [
      generation("8U", "8U · 1. nesil", 2011, 2018, suv, [
        ["1.4 TFSI", 150],
        ["2.0 TDI", 140, 177],
      ]),
      generation("F3", "F3 · 2. nesil", 2018, 2026, suv, [
        ["35 TFSI 1.5", 150],
        ["35 TDI 2.0", 150],
      ]),
    ]),
  ]),
  brand("BMW", [
    model("1 Serisi", [
      generation("E87", "E87 · 1. nesil", 2004, 2011, hatch, [
        ["116i 1.6", 115, 122],
        ["118i 2.0", 129, 143],
        ["116d 2.0", 116],
        ["118d 2.0", 143],
      ]),
      generation("F20", "F20 · 2. nesil", 2011, 2019, hatch, [
        ["116i 1.6", 136],
        ["118i 1.6", 136, 170],
        ["116d 1.5", 116],
        ["118d 2.0", 143, 150],
      ]),
      generation("F40", "F40 · 3. nesil", 2019, 2026, hatch, [
        ["118i 1.5", 136, 140],
        ["120i 2.0", 178],
        ["116d 1.5", 116],
        ["118d 2.0", 150],
      ]),
    ]),
    model("3 Serisi", [
      generation("E46", "E46 · 4. nesil", 1998, 2006, [
        "Sedan",
        "Coupe",
        "Station wagon",
      ], [
        ["316i 1.8", 105, 115],
        ["318i 2.0", 143],
        ["320d 2.0", 136, 150],
      ]),
      generation("E90", "E90 · 5. nesil", 2005, 2012, [
        "Sedan",
        "Coupe",
        "Station wagon",
      ], [
        ["316i 1.6", 115, 122],
        ["320i 2.0", 150, 170],
        ["320d 2.0", 163, 177],
      ]),
      generation("F30", "F30 · 6. nesil", 2011, 2019, [
        "Sedan",
        "Station wagon",
      ], [
        ["316i 1.6", 136],
        ["320i 1.6", 170],
        ["320d 2.0", 184, 190],
      ]),
      generation("G20", "G20 · 7. nesil", 2019, 2026, [
        "Sedan",
        "Station wagon",
      ], [
        ["320i 1.6", 170],
        ["330i 2.0", 258],
        ["320d 2.0", 190],
      ]),
    ]),
    model("5 Serisi", [
      generation("E60", "E60 · 5. nesil", 2003, 2010, [
        "Sedan",
        "Station wagon",
      ], [
        ["520i 2.0", 170],
        ["525i 2.5", 218],
        ["520d 2.0", 163, 177],
      ]),
      generation("F10", "F10 · 6. nesil", 2010, 2017, [
        "Sedan",
        "Station wagon",
      ], [
        ["520i 2.0", 184],
        ["520d 2.0", 184],
        ["525d 2.0", 218],
      ]),
      generation("G30", "G30 · 7. nesil", 2017, 2024, [
        "Sedan",
        "Station wagon",
      ], [
        ["520i 1.6", 170],
        ["530i 2.0", 252],
        ["520d 2.0", 190],
      ]),
    ]),
    model("X1", [
      generation("E84", "E84 · 1. nesil", 2009, 2015, suv, [
        ["sDrive18i 2.0", 150],
        ["sDrive18d 2.0", 143],
      ]),
      generation("F48", "F48 · 2. nesil", 2015, 2022, suv, [
        ["sDrive18i 1.5", 136],
        ["sDrive20i 2.0", 192],
        ["sDrive16d 1.5", 116],
      ]),
      generation("U11", "U11 · 3. nesil", 2022, 2026, suv, [
        ["sDrive18i 1.5", 136],
        ["sDrive20i 1.5", 170],
        ["sDrive18d 2.0", 150],
      ]),
    ]),
  ]),
  brand("BYD", [
    model("Atto 3", [
      generation("YUAN-PLUS", "Yuan Plus · elektrikli SUV", 2023, 2026, suv, [
        ["Elektrik", 204],
      ]),
    ]),
    model("Dolphin", [
      generation("DOLPHIN", "Dolphin · elektrikli hatchback", 2024, 2026, hatch, [
        ["Elektrik", 95, 204],
      ]),
    ]),
    model("Seal", [
      generation("SEAL", "Seal · elektrikli sedan", 2024, 2026, sedan, [
        ["Elektrik", 313, 530],
      ]),
    ]),
  ]),
  brand("Chevrolet", [
    model("Aveo", [
      generation("T250", "T250 · 1. nesil", 2006, 2011, hatchSedan, [
        ["1.2", 72, 84],
        ["1.4", 94],
        ["1.4 LPG", 94],
        ["1.3 D", 75],
      ]),
      generation("T300", "T300 · 2. nesil", 2011, 2016, hatchSedan, [
        ["1.2", 70, 86],
        ["1.4", 100, 101],
        ["1.3 D", 75, 95],
      ]),
    ]),
    model("Cruze", [
      generation("J300", "J300 · 1. nesil", 2009, 2016, [
        "Sedan",
        "Hatchback",
        "Station wagon",
      ], [
        ["1.6", 113, 124],
        ["1.4 Turbo", 140],
        ["1.6 LPG", 124],
        ["2.0 Diesel", 150, 163],
      ]),
    ]),
  ]),
  brand("Citroën", [
    model("Berlingo", [
      generation("B9", "B9 · 2. nesil", 2008, 2018, [
        "Panelvan",
        "Multispace",
      ], [
        ["1.6 HDi", 75, 90, 110],
        ["1.6 VTi", 95],
      ]),
      generation("K9", "K9 · 3. nesil", 2018, 2026, [
        "Panelvan",
        "Multispace",
      ], [
        ["1.2 PureTech", 110, 130],
        ["1.5 BlueHDi", 100, 130],
        ["Elektrik", 136],
      ]),
    ]),
    model("C3", [
      generation("A51", "A51 · 2. nesil", 2009, 2016, hatch, [
        ["1.4 VTi", 95],
        ["1.2 VTi", 82],
        ["1.4 HDi", 70],
        ["1.6 HDi", 92],
      ]),
      generation("SX", "SX · 3. nesil", 2016, 2024, hatch, [
        ["1.2 PureTech", 82, 110],
        ["1.5 BlueHDi", 100, 102],
      ]),
      generation("CC21", "CC21 · 4. nesil", 2024, 2026, hatch, [
        ["1.2 Hybrid", 100, 110],
        ["Elektrik", 113],
      ]),
    ]),
    model("C4", [
      generation("B7", "B7 · 2. nesil", 2010, 2018, [
        "Hatchback",
        "Sedan",
      ], [
        ["1.6 VTi", 120],
        ["1.2 PureTech", 130],
        ["1.6 HDi", 92, 115],
      ]),
      generation("C41", "C41 · 3. nesil", 2020, 2026, hatchSuv, [
        ["1.2 PureTech", 130],
        ["1.5 BlueHDi", 130],
        ["Elektrik", 136, 156],
      ]),
    ]),
    model("C-Elysée", [
      generation("A51", "A51 · sedan", 2012, 2020, sedan, [
        ["1.2 VTi", 72, 82],
        ["1.6 VTi", 115],
        ["1.6 HDi", 92],
      ]),
    ]),
  ]),
  brand("Cupra", [
    model("Formentor", [
      generation("KM", "KM · crossover", 2020, 2026, suv, [
        ["1.5 TSI", 150],
        ["2.0 TSI", 190, 310],
        ["2.0 TDI", 150],
        ["1.4 e-Hybrid", 204, 245],
      ]),
    ]),
  ]),
  brand("Dacia", [
    model("Duster", [
      generation("HS", "HS · 1. nesil", 2010, 2018, suv, [
        ["1.6 MPI", 105, 110],
        ["1.2 TCe", 125],
        ["1.5 dCi", 90, 110],
      ]),
      generation("HM", "HM · 2. nesil", 2018, 2024, suv, [
        ["1.0 TCe", 100],
        ["1.3 TCe", 130, 150],
        ["1.5 Blue dCi", 115],
      ]),
      generation("P1310", "P1310 · 3. nesil", 2024, 2026, suv, [
        ["1.2 TCe mild hybrid", 130],
        ["1.6 Hybrid", 140, 155],
        ["1.2 ECO-G", 100],
      ]),
    ]),
    model("Jogger", [
      generation("RJI", "RJI · 1. nesil", 2022, 2026, [
        "MPV · 5 koltuk",
        "MPV · 7 koltuk",
      ], [
        ["1.0 TCe", 110],
        ["1.0 ECO-G", 100],
        ["1.6 Hybrid", 140],
      ]),
    ]),
    model("Sandero", [
      generation("B90", "B90 · 1. nesil", 2008, 2012, hatch, [
        ["1.4 MPI", 75],
        ["1.6 MPI", 87],
        ["1.5 dCi", 68, 85],
      ]),
      generation("B52", "B52 · 2. nesil", 2012, 2020, hatch, [
        ["1.0 SCe", 73, 75],
        ["0.9 TCe", 90],
        ["1.5 dCi", 75, 90],
      ]),
      generation("DJF", "DJF · 3. nesil", 2020, 2026, hatch, [
        ["1.0 SCe", 65],
        ["1.0 TCe", 90, 100],
        ["1.0 ECO-G", 100],
      ]),
    ]),
  ]),
  brand("Fiat", [
    model("500", [
      generation("312", "312 · 1. nesil", 2007, 2026, [
        "Hatchback",
        "Cabrio",
      ], [
        ["1.2 Fire", 69],
        ["0.9 TwinAir", 85, 105],
        ["1.3 Multijet", 75, 95],
        ["Elektrik", 95, 118],
      ]),
    ]),
    model("Doblo", [
      generation("223", "223 · 1. nesil", 2000, 2010, [
        "Panelvan",
        "Combi",
      ], [
        ["1.2 MPI", 65],
        ["1.4 MPI", 77],
        ["1.3 Multijet", 70, 85],
        ["1.9 Multijet", 105],
      ]),
      generation("263", "263 · 2. nesil", 2010, 2022, [
        "Panelvan",
        "Combi",
      ], [
        ["1.4 Fire", 95],
        ["1.3 Multijet", 90, 95],
        ["1.6 Multijet", 105, 120],
        ["2.0 Multijet", 135],
      ]),
      generation("K9", "K9 · 3. nesil", 2022, 2026, [
        "Panelvan",
        "Combi",
      ], [
        ["1.5 BlueHDi", 100, 130],
        ["Elektrik", 136],
      ]),
    ]),
    model("Egea", [
      generation("356", "356 · sedan / hatchback / SW", 2015, 2026, [
        "Sedan",
        "Hatchback",
        "Station wagon",
        "Cross",
      ], [
        ["1.4 Fire", 95],
        ["1.0 FireFly Turbo", 100],
        ["1.3 Multijet", 95],
        ["1.6 Multijet", 120, 130],
      ]),
    ]),
    model("Fiorino", [
      generation("225", "225 · 1. nesil", 2007, 2026, [
        "Combi",
        "Panelvan",
      ], [
        ["1.4 Fire", 77],
        ["1.3 Multijet", 75, 80, 95],
        ["1.3 Multijet Euro 6", 80, 95],
      ]),
    ]),
    model("Linea", [
      generation("323", "323 · sedan", 2007, 2016, sedan, [
        ["1.4 Fire", 77, 95],
        ["1.3 Multijet", 90, 95],
        ["1.6 Multijet", 105],
      ]),
    ]),
  ]),
  brand("Ford", [
    model("Courier", [
      generation("B460", "B460 · 1. nesil", 2014, 2023, [
        "Kombi",
        "Panelvan",
      ], [
        ["1.0 EcoBoost", 100],
        ["1.5 TDCi", 75, 95],
        ["1.5 EcoBlue", 100],
      ]),
      generation("BJA", "BJA · 2. nesil", 2023, 2026, [
        "Kombi",
        "Panelvan",
      ], [
        ["1.0 EcoBoost", 100, 125],
        ["1.5 EcoBlue", 100],
        ["Elektrik", 136],
      ]),
    ]),
    model("Focus", [
      generation("C307", "C307 · 2. nesil", 2004, 2011, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.6 Duratec", 100, 115],
        ["1.6 TDCi", 90, 109],
        ["2.0 TDCi", 136],
      ]),
      generation("C346", "C346 · 3. nesil", 2011, 2018, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.6 Ti-VCT", 105, 125],
        ["1.0 EcoBoost", 100, 125],
        ["1.6 TDCi", 95, 115],
        ["1.5 TDCi", 120],
      ]),
      generation("C519", "C519 · 4. nesil", 2018, 2025, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.0 EcoBoost", 100, 125, 155],
        ["1.5 EcoBoost", 150, 182],
        ["1.5 EcoBlue", 95, 120],
      ]),
    ]),
    model("Kuga", [
      generation("C394", "C394 · 2. nesil", 2012, 2019, suv, [
        ["1.5 EcoBoost", 150, 182],
        ["1.5 TDCi", 120],
        ["2.0 TDCi", 150, 180],
      ]),
      generation("C520", "C520 · 3. nesil", 2019, 2026, suv, [
        ["1.5 EcoBoost", 120, 150],
        ["1.5 EcoBlue", 120],
        ["2.0 EcoBlue", 150, 190],
        ["2.5 Hybrid", 190, 225],
      ]),
    ]),
    model("Transit Connect", [
      generation("C170", "C170 · 1. nesil", 2002, 2013, [
        "Kombi",
        "Panelvan",
      ], [
        ["1.8 Duratorq TDCi", 75, 90, 110],
        ["1.8 Duratec", 115],
      ]),
      generation("C344", "C344 · 2. nesil", 2013, 2022, [
        "Kombi",
        "Panelvan",
      ], [
        ["1.0 EcoBoost", 100],
        ["1.5 TDCi", 75, 100, 120],
        ["1.5 EcoBlue", 100, 120],
      ]),
    ]),
    model("Fiesta", [
      generation("B299", "B299 · 6. nesil", 2008, 2017, hatch, [
        ["1.25 Duratec", 60, 82],
        ["1.0 EcoBoost", 100, 125],
        ["1.4 TDCi", 68],
        ["1.5 TDCi", 75, 95],
      ]),
      generation("B479", "B479 · 7. nesil", 2017, 2023, hatch, [
        ["1.0 EcoBoost", 100, 125, 155],
        ["1.1 Ti-VCT", 70, 85],
        ["1.5 TDCi", 85, 120],
      ]),
    ]),
    model("Puma", [
      generation("CX482", "CX482 · crossover", 2019, 2026, suv, [
        ["1.0 EcoBoost", 125, 155],
        ["1.0 EcoBoost Hybrid", 125, 155],
        ["1.5 EcoBlue", 120],
      ]),
    ]),
  ]),
  brand("Honda", [
    model("Civic", [
      generation("ES", "ES · 7. nesil", 2001, 2005, sedan, [
        ["1.4 i-DSI", 90],
        ["1.6 VTEC", 110],
        ["1.7 CTDi", 100],
      ]),
      generation("FD", "FD · 8. nesil", 2006, 2011, [
        "Sedan",
        "Hatchback",
      ], [
        ["1.4 i-DSI", 83],
        ["1.6 i-VTEC", 125],
        ["1.8 i-VTEC", 140],
      ]),
      generation("FB", "FB · 9. nesil", 2012, 2016, sedan, [
        ["1.6 i-VTEC", 125],
        ["1.8 i-VTEC", 142],
      ]),
      generation("FC5", "FC5 · 10. nesil", 2016, 2022, sedan, [
        ["1.6 i-VTEC", 125],
        ["1.5 VTEC Turbo", 182],
        ["1.6 i-DTEC", 120],
      ]),
      generation("FE1", "FE1 · 11. nesil", 2022, 2026, sedan, [
        ["1.5 VTEC Turbo", 182],
        ["2.0 e:HEV", 184],
      ]),
    ]),
    model("CR-V", [
      generation("RE", "RE · 3. nesil", 2007, 2012, suv, [
        ["2.0 i-VTEC", 150],
        ["2.2 i-DTEC", 150],
      ]),
      generation("RM", "RM · 4. nesil", 2012, 2018, suv, [
        ["2.0 i-VTEC", 155],
        ["1.6 i-DTEC", 120, 160],
      ]),
      generation("RW", "RW · 5. nesil", 2018, 2023, suv, [
        ["1.5 VTEC Turbo", 173, 193],
        ["2.0 i-MMD Hybrid", 184],
      ]),
      generation("RS", "RS · 6. nesil", 2023, 2026, suv, [
        ["2.0 e:HEV", 184],
      ]),
    ]),
    model("Jazz", [
      generation("GE", "GE · 2. nesil", 2008, 2014, hatch, [
        ["1.2 i-VTEC", 90],
        ["1.4 i-VTEC", 100],
      ]),
      generation("GK", "GK · 3. nesil", 2014, 2020, hatch, [
        ["1.3 i-VTEC", 102],
        ["1.5 i-VTEC", 130],
      ]),
      generation("GR", "GR · 4. nesil", 2020, 2026, hatch, [
        ["1.5 e:HEV", 109, 122],
      ]),
    ]),
  ]),
  brand("Hyundai", [
    model("i10", [
      generation("PA", "PA · 1. nesil", 2008, 2013, hatch, [
        ["1.1", 66],
        ["1.2", 78],
      ]),
      generation("IA", "IA · 2. nesil", 2013, 2019, hatch, [
        ["1.0 MPI", 66],
        ["1.2 MPI", 87],
      ]),
      generation("AC3", "AC3 · 3. nesil", 2019, 2026, hatch, [
        ["1.0 MPI", 67],
        ["1.2 MPI", 84],
      ]),
    ]),
    model("i20", [
      generation("PB", "PB · 1. nesil", 2008, 2014, hatch, [
        ["1.2 MPI", 78],
        ["1.4 MPI", 100],
        ["1.4 CRDi", 75, 90],
      ]),
      generation("GB", "GB · 2. nesil", 2014, 2020, hatch, [
        ["1.2 MPI", 84],
        ["1.4 MPI", 100],
        ["1.4 CRDi", 90],
      ]),
      generation("BC3", "BC3 · 3. nesil", 2020, 2026, hatch, [
        ["1.0 T-GDi", 100, 120],
        ["1.2 MPI", 84],
        ["1.4 MPI", 100],
      ]),
    ]),
    model("i30", [
      generation("FD", "FD · 1. nesil", 2007, 2012, hatchSedan, [
        ["1.4 MPI", 109],
        ["1.6 MPI", 126],
        ["1.6 CRDi", 90, 115],
      ]),
      generation("GD", "GD · 2. nesil", 2012, 2017, hatchSedan, [
        ["1.4 MPI", 100],
        ["1.6 GDI", 135],
        ["1.6 CRDi", 110, 128],
      ]),
      generation("PD", "PD · 3. nesil", 2017, 2026, hatchSedan, [
        ["1.0 T-GDi", 120],
        ["1.4 T-GDi", 140],
        ["1.6 CRDi", 115, 136],
      ]),
    ]),
    model("Tucson", [
      generation("LM", "LM · 2. nesil", 2009, 2015, suv, [
        ["1.6 GDI", 135],
        ["2.0 CRDi", 136],
      ]),
      generation("TL", "TL · 3. nesil", 2015, 2020, suv, [
        ["1.6 GDI", 132],
        ["1.6 T-GDi", 177],
        ["1.6 CRDi", 115, 136],
      ]),
      generation("NX4", "NX4 · 4. nesil", 2020, 2026, suv, [
        ["1.6 T-GDi", 150, 180],
        ["1.6 CRDi", 136],
        ["1.6 Hybrid", 230],
      ]),
    ]),
  ]),
  brand("Isuzu", [
    model("D-Max", [
      generation("TF", "TF · 2. nesil", 2012, 2020, [
        "Tek kabin pickup",
        "Çift kabin pickup",
      ], [
        ["2.5 Ddi", 116, 163],
        ["1.9 Ddi", 164],
      ]),
      generation("RG", "RG · 3. nesil", 2020, 2026, [
        "Tek kabin pickup",
        "Çift kabin pickup",
      ], [
        ["1.9 Ddi", 163],
      ]),
    ]),
  ]),
  brand("Jeep", [
    model("Compass", [
      generation("MP", "MP · 2. nesil", 2017, 2026, suv, [
        ["1.4 MultiAir", 140, 170],
        ["1.6 MultiJet", 120],
        ["1.3 T4", 130, 150],
        ["1.5 e-Hybrid", 130],
      ]),
    ]),
    model("Renegade", [
      generation("BU", "BU · 1. nesil", 2014, 2026, suv, [
        ["1.0 T3", 120],
        ["1.3 T4", 150, 180],
        ["1.6 MultiJet", 120],
        ["1.5 e-Hybrid", 130],
      ]),
    ]),
  ]),
  brand("Kia", [
    model("Ceed", [
      generation("ED", "ED · 1. nesil", 2006, 2012, hatchSedan, [
        ["1.4 MPI", 109],
        ["1.6 MPI", 122, 126],
        ["1.6 CRDi", 90, 115],
      ]),
      generation("JD", "JD · 2. nesil", 2012, 2018, hatchSedan, [
        ["1.4 MPI", 100],
        ["1.6 GDI", 135],
        ["1.6 CRDi", 110, 128],
      ]),
      generation("CD", "CD · 3. nesil", 2018, 2026, hatchSedan, [
        ["1.0 T-GDi", 120],
        ["1.5 T-GDi", 160],
        ["1.6 CRDi", 115, 136],
      ]),
    ]),
    model("Picanto", [
      generation("TA", "TA · 2. nesil", 2011, 2017, hatch, [
        ["1.0 MPI", 69],
        ["1.2 MPI", 85],
      ]),
      generation("JA", "JA · 3. nesil", 2017, 2026, hatch, [
        ["1.0 MPI", 67],
        ["1.2 MPI", 84],
      ]),
    ]),
    model("Rio", [
      generation("UB", "UB · 3. nesil", 2011, 2017, hatchSedan, [
        ["1.25 MPI", 85],
        ["1.4 MPI", 109],
        ["1.4 CRDi", 90],
      ]),
      generation("YB", "YB · 4. nesil", 2017, 2023, hatchSedan, [
        ["1.25 MPI", 84],
        ["1.4 MPI", 100],
        ["1.0 T-GDi", 100, 120],
        ["1.4 CRDi", 90],
      ]),
    ]),
    model("Sportage", [
      generation("SL", "SL · 3. nesil", 2010, 2015, suv, [
        ["1.6 GDI", 135],
        ["1.7 CRDi", 115],
        ["2.0 CRDi", 136],
      ]),
      generation("QL", "QL · 4. nesil", 2015, 2021, suv, [
        ["1.6 GDI", 132],
        ["1.6 T-GDi", 177],
        ["1.6 CRDi", 115, 136],
      ]),
      generation("NQ5", "NQ5 · 5. nesil", 2021, 2026, suv, [
        ["1.6 T-GDi", 150, 180],
        ["1.6 CRDi", 136],
        ["1.6 HEV", 230],
      ]),
    ]),
  ]),
  brand("Mazda", [
    model("3", [
      generation("BK", "BK · 1. nesil", 2003, 2009, hatchSedan, [
        ["1.6 MZR", 105],
        ["2.0 MZR", 150],
      ]),
      generation("BL", "BL · 2. nesil", 2009, 2013, hatchSedan, [
        ["1.6 MZR", 105],
        ["2.0 MZR", 150],
      ]),
      generation("BM", "BM · 3. nesil", 2013, 2019, hatchSedan, [
        ["1.5 Skyactiv-G", 100],
        ["2.0 Skyactiv-G", 120, 165],
        ["1.5 Skyactiv-D", 105],
      ]),
      generation("BP", "BP · 4. nesil", 2019, 2026, hatchSedan, [
        ["2.0 Skyactiv-G", 122, 150],
        ["2.0 e-Skyactiv X", 186],
      ]),
    ]),
    model("CX-5", [
      generation("KE", "KE · 1. nesil", 2012, 2017, suv, [
        ["2.0 Skyactiv-G", 160, 165],
        ["2.2 Skyactiv-D", 150, 175],
      ]),
      generation("KF", "KF · 2. nesil", 2017, 2026, suv, [
        ["2.0 Skyactiv-G", 165],
        ["2.5 Skyactiv-G", 194],
        ["2.2 Skyactiv-D", 150, 184],
      ]),
    ]),
  ]),
  brand("Mercedes-Benz", [
    model("A Serisi", [
      generation("W169", "W169 · 2. nesil", 2004, 2012, hatch, [
        ["A 150 / A 160 1.5", 95, 102],
        ["A 170 / A 180 1.7", 116, 122],
        ["A 180 CDI", 109],
      ]),
      generation("W176", "W176 · 3. nesil", 2012, 2018, hatch, [
        ["A 180 1.6", 122, 136],
        ["A 200 1.6", 156, 184],
        ["A 180 CDI 1.5", 109, 116],
      ]),
      generation("W177", "W177 · 4. nesil", 2018, 2026, hatchSedan, [
        ["A 180 1.3", 136],
        ["A 200 1.3", 163],
        ["A 180 d 1.5", 116],
        ["A 200 d 2.0", 150],
      ]),
    ]),
    model("C Serisi", [
      generation("W203", "W203 · 2. nesil", 2000, 2007, [
        "Sedan",
        "Station wagon",
        "Coupe",
      ], [
        ["C 180 Kompressor 1.8", 143],
        ["C 200 CDI 2.2", 116, 122],
        ["C 220 CDI 2.2", 143, 150],
      ]),
      generation("W204", "W204 · 3. nesil", 2007, 2014, [
        "Sedan",
        "Station wagon",
        "Coupe",
      ], [
        ["C 180 1.6 / 1.8", 156],
        ["C 200 CGI 1.8", 184],
        ["C 220 CDI 2.1", 170],
      ]),
      generation("W205", "W205 · 4. nesil", 2014, 2021, [
        "Sedan",
        "Station wagon",
        "Coupe",
      ], [
        ["C 180 1.6", 156],
        ["C 200 2.0", 184],
        ["C 200 d 2.1", 136],
      ]),
      generation("W206", "W206 · 5. nesil", 2021, 2026, [
        "Sedan",
        "Station wagon",
      ], [
        ["C 180 1.5", 170],
        ["C 200 1.5", 204],
        ["C 220 d 2.0", 200],
      ]),
    ]),
    model("E Serisi", [
      generation("W211", "W211 · 3. nesil", 2002, 2009, [
        "Sedan",
        "Station wagon",
      ], [
        ["E 200 Kompressor 1.8", 163, 184],
        ["E 220 CDI 2.2", 150, 170],
        ["E 280 CDI 3.0", 190],
      ]),
      generation("W212", "W212 · 4. nesil", 2009, 2016, [
        "Sedan",
        "Station wagon",
      ], [
        ["E 180 1.6", 156],
        ["E 200 2.0", 184],
        ["E 220 CDI 2.1", 170],
      ]),
      generation("W213", "W213 · 5. nesil", 2016, 2023, [
        "Sedan",
        "Station wagon",
      ], [
        ["E 180 1.6", 156],
        ["E 200 2.0", 184],
        ["E 220 d 2.0", 194],
      ]),
    ]),
    model("GLA", [
      generation("H247", "H247 · 2. nesil", 2020, 2026, suv, [
        ["GLA 180 1.3", 136],
        ["GLA 200 1.3", 163],
        ["GLA 200 d 2.0", 150],
      ]),
    ]),
  ]),
  brand("MG", [
    model("ZS", [
      generation("ZS1", "ZS · crossover", 2017, 2026, suv, [
        ["1.0 T-GDi", 111],
        ["1.5 VTi-Tech", 106],
        ["Elektrik", 156, 177],
      ]),
    ]),
    model("HS", [
      generation("HS1", "HS · SUV", 2019, 2026, suv, [
        ["1.5 T-GDi", 162, 170],
        ["1.5 Plug-in Hybrid", 258],
      ]),
    ]),
  ]),
  brand("Mitsubishi", [
    model("ASX", [
      generation("GA", "GA · 1. nesil", 2010, 2022, suv, [
        ["1.6 MIVEC", 117, 115],
        ["1.8 DI-D", 150],
        ["1.6 DI-D", 114],
      ]),
      generation("GN", "GN · 2. nesil", 2023, 2026, suv, [
        ["1.3 DI-T", 140],
        ["1.6 Hybrid", 145],
      ]),
    ]),
    model("Lancer", [
      generation("CY", "CY · 10. nesil", 2007, 2017, [
        "Sedan",
        "Sportback",
      ], [
        ["1.5 MIVEC", 109],
        ["1.6 MIVEC", 117],
        ["1.8 MIVEC", 143],
        ["1.8 DI-D", 150],
      ]),
    ]),
  ]),
  brand("Nissan", [
    model("Juke", [
      generation("F15", "F15 · 1. nesil", 2010, 2019, suv, [
        ["1.2 DIG-T", 115],
        ["1.6 DIG-T", 190],
        ["1.5 dCi", 110],
      ]),
      generation("F16", "F16 · 2. nesil", 2019, 2026, suv, [
        ["1.0 DIG-T", 114, 117],
        ["1.6 Hybrid", 143],
      ]),
    ]),
    model("Micra", [
      generation("K12", "K12 · 3. nesil", 2002, 2010, hatch, [
        ["1.2", 65, 80],
        ["1.4", 88],
        ["1.5 dCi", 65, 82],
      ]),
      generation("K13", "K13 · 4. nesil", 2010, 2017, hatch, [
        ["1.2", 80],
        ["1.2 DIG-S", 98],
        ["1.5 dCi", 90],
      ]),
      generation("K14", "K14 · 5. nesil", 2017, 2022, hatch, [
        ["0.9 IG-T", 90],
        ["1.0 IG-T", 100],
        ["1.5 dCi", 90],
      ]),
    ]),
    model("Qashqai", [
      generation("J10", "J10 · 1. nesil", 2007, 2013, suv, [
        ["1.6", 115],
        ["2.0", 141],
        ["1.5 dCi", 103, 106],
        ["1.6 dCi", 130],
      ]),
      generation("J11", "J11 · 2. nesil", 2013, 2021, suv, [
        ["1.2 DIG-T", 115],
        ["1.3 DIG-T", 140, 160],
        ["1.5 dCi", 110, 115],
        ["1.6 dCi", 130],
      ]),
      generation("J12", "J12 · 3. nesil", 2021, 2026, suv, [
        ["1.3 DIG-T MHEV", 140, 158],
        ["1.5 e-POWER", 190, 204],
      ]),
    ]),
  ]),
  brand("Opel", [
    model("Astra", [
      generation("H", "H · 3. nesil", 2004, 2010, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.4 Twinport", 90],
        ["1.6 Twinport", 105, 115],
        ["1.3 CDTI", 90],
        ["1.7 CDTI", 100, 110],
      ]),
      generation("J", "J · 4. nesil", 2009, 2015, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.4", 100],
        ["1.4 Turbo", 140],
        ["1.6 CDTI", 110, 136],
      ]),
      generation("K", "K · 5. nesil", 2015, 2021, hatchSedan, [
        ["1.0 Turbo", 105],
        ["1.4 Turbo", 125, 150],
        ["1.6 CDTI", 110, 136],
      ]),
      generation("L", "L · 6. nesil", 2021, 2026, hatch, [
        ["1.2 Turbo", 110, 130],
        ["1.5 Diesel", 130],
        ["Elektrik", 156],
      ]),
    ]),
    model("Corsa", [
      generation("D", "D · 4. nesil", 2006, 2014, hatch, [
        ["1.2 Twinport", 80, 85],
        ["1.4 Twinport", 90, 100],
        ["1.3 CDTI", 75, 95],
      ]),
      generation("E", "E · 5. nesil", 2014, 2019, hatch, [
        ["1.2", 70],
        ["1.4", 90, 100],
        ["1.3 CDTI", 75, 95],
      ]),
      generation("F", "F · 6. nesil", 2019, 2026, hatch, [
        ["1.2", 75],
        ["1.2 Turbo", 100, 130],
        ["1.5 Diesel", 102],
        ["Elektrik", 136, 156],
      ]),
    ]),
    model("Mokka", [
      generation("J13", "J13 · 1. nesil", 2012, 2019, suv, [
        ["1.4 Turbo", 140],
        ["1.6", 115],
        ["1.6 CDTI", 110, 136],
      ]),
      generation("P2QO", "P2QO · 2. nesil", 2020, 2026, suv, [
        ["1.2 Turbo", 100, 130],
        ["1.5 Diesel", 110],
        ["Elektrik", 136, 156],
      ]),
    ]),
  ]),
  brand("Peugeot", [
    model("2008", [
      generation("A94", "A94 · 1. nesil", 2013, 2019, suv, [
        ["1.2 VTi / PureTech", 82, 110, 130],
        ["1.6 VTi", 120],
        ["1.6 e-HDi / BlueHDi", 92, 100, 120],
      ]),
      generation("P24", "P24 · 2. nesil", 2019, 2026, suv, [
        ["1.2 PureTech", 100, 130, 155],
        ["1.5 BlueHDi", 100, 110, 130],
        ["Elektrik", 136, 156],
      ]),
    ]),
    model("208", [
      generation("A9", "A9 · 1. nesil", 2012, 2019, hatch, [
        ["1.2 VTi / PureTech", 68, 82, 110],
        ["1.4 HDi", 68],
        ["1.6 BlueHDi", 75, 100, 120],
      ]),
      generation("P21", "P21 · 2. nesil", 2019, 2026, hatch, [
        ["1.2 PureTech", 75, 100, 130],
        ["1.5 BlueHDi", 100, 102],
        ["Elektrik", 136, 156],
      ]),
    ]),
    model("301", [
      generation("M3", "M3 · sedan", 2012, 2021, sedan, [
        ["1.2 VTi", 72, 82],
        ["1.6 VTi", 115],
        ["1.6 HDi", 92, 100],
      ]),
    ]),
    model("308", [
      generation("T7", "T7 · 1. nesil", 2007, 2013, hatch, [
        ["1.6 VTi", 120],
        ["1.6 THP", 150, 156],
        ["1.6 HDi", 90, 110],
      ]),
      generation("T9", "T9 · 2. nesil", 2013, 2021, hatch, [
        ["1.2 PureTech", 110, 130],
        ["1.6 THP", 156, 205],
        ["1.6 BlueHDi", 100, 120],
      ]),
      generation("P5", "P5 · 3. nesil", 2021, 2026, hatch, [
        ["1.2 PureTech", 130],
        ["1.5 BlueHDi", 130],
        ["1.6 Plug-in Hybrid", 180, 225],
      ]),
    ]),
    model("3008", [
      generation("T84", "T84 · 1. nesil", 2009, 2016, [
        "SUV",
        "MPV",
      ], [
        ["1.6 VTi", 120],
        ["1.6 THP", 156],
        ["1.6 HDi", 112, 115],
      ]),
      generation("P84", "P84 · 2. nesil", 2016, 2023, suv, [
        ["1.2 PureTech", 130],
        ["1.6 THP", 165],
        ["1.5 BlueHDi", 130],
        ["1.6 Hybrid", 225, 300],
      ]),
      generation("P64", "P64 · 3. nesil", 2023, 2026, suv, [
        ["1.2 Hybrid", 136],
        ["1.6 Plug-in Hybrid", 195],
        ["Elektrik", 210, 230],
      ]),
    ]),
    model("Rifter", [
      generation("K9", "K9 · 1. nesil", 2018, 2026, [
        "Combi",
        "Panelvan",
      ], [
        ["1.2 PureTech", 110, 130],
        ["1.5 BlueHDi", 100, 130],
        ["Elektrik", 136],
      ]),
    ]),
  ]),
  brand("Renault", [
    model("Clio", [
      generation("X65", "X65 · 2. nesil", 1998, 2005, hatch, [
        ["1.2 8V", 58],
        ["1.4 16V", 98],
        ["1.5 dCi", 65, 80, 100],
      ]),
      generation("X85", "X85 · 3. nesil", 2005, 2012, hatch, [
        ["1.2 16V", 75, 80],
        ["1.4 16V", 98],
        ["1.5 dCi", 68, 85, 105],
      ]),
      generation("X98", "X98 · 4. nesil", 2012, 2019, hatch, [
        ["0.9 TCe", 90],
        ["1.2 TCe", 120],
        ["1.5 dCi", 75, 90, 110],
      ]),
      generation("BJA", "BJA · 5. nesil", 2019, 2026, hatch, [
        ["1.0 SCe", 65, 72],
        ["1.0 TCe", 90, 100],
        ["1.5 Blue dCi", 100, 115],
        ["1.6 E-Tech Hybrid", 140, 145],
      ]),
    ]),
    model("Kangoo", [
      generation("KC", "KC · 1. nesil", 1997, 2007, [
        "Combi",
        "Panelvan",
      ], [
        ["1.4", 75],
        ["1.6 16V", 95],
        ["1.5 dCi", 65, 80, 85],
      ]),
      generation("KW", "KW · 2. nesil", 2007, 2021, [
        "Combi",
        "Panelvan",
      ], [
        ["1.6 16V", 105],
        ["1.5 dCi", 70, 85, 90, 110],
      ]),
      generation("KFK", "KFK · 3. nesil", 2021, 2026, [
        "Combi",
        "Panelvan",
      ], [
        ["1.3 TCe", 100, 130],
        ["1.5 Blue dCi", 75, 95, 115],
        ["Elektrik", 122],
      ]),
    ]),
    model("Megane", [
      generation("X64", "X64 · 1. nesil", 1995, 2002, [
        "Hatchback",
        "Sedan",
        "Coupe",
        "Station wagon",
      ], [
        ["1.4 16V", 95],
        ["1.6 16V", 107, 110],
        ["1.9 dTi / dCi", 80, 100, 102],
      ]),
      generation("X84", "X84 · 2. nesil", 2002, 2009, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.4 16V", 98],
        ["1.6 16V", 115],
        ["1.5 dCi", 80, 100, 105],
        ["1.9 dCi", 120, 130],
      ]),
      generation("X95", "X95 · 3. nesil", 2008, 2016, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.6 16V", 110],
        ["1.2 TCe", 115, 130],
        ["1.5 dCi", 90, 110],
        ["1.6 dCi", 130],
      ]),
      generation("XFB", "XFB · 4. nesil", 2016, 2023, [
        "Hatchback",
        "Sedan",
        "Station wagon",
      ], [
        ["1.3 TCe", 115, 140, 160],
        ["1.5 Blue dCi", 115],
        ["1.6 dCi", 130, 160],
      ]),
    ]),
    model("Taliant", [
      generation("LJL", "LJL · sedan", 2021, 2026, sedan, [
        ["1.0 SCe", 65],
        ["1.0 TCe", 90, 100],
      ]),
    ]),
  ]),
  brand("SEAT", [
    model("Ibiza", [
      generation("6L", "6L · 3. nesil", 2002, 2009, hatch, [
        ["1.4 16V", 75, 100],
        ["1.6 16V", 105],
        ["1.4 TDI", 70, 80],
      ]),
      generation("6J", "6J · 4. nesil", 2008, 2017, hatch, [
        ["1.2 TSI", 85, 105],
        ["1.4 TSI", 150],
        ["1.6 TDI", 90, 105],
      ]),
      generation("KJ", "KJ · 5. nesil", 2017, 2026, hatch, [
        ["1.0 MPI", 80],
        ["1.0 TSI", 95, 110],
        ["1.6 TDI", 95],
      ]),
    ]),
    model("Leon", [
      generation("1P", "1P · 2. nesil", 2005, 2012, hatch, [
        ["1.6 MPI", 102],
        ["1.4 TSI", 125],
        ["1.6 TDI", 105],
        ["2.0 TDI", 140],
      ]),
      generation("5F", "5F · 3. nesil", 2012, 2020, hatch, [
        ["1.2 TSI", 105, 110],
        ["1.4 TSI", 125, 150],
        ["1.6 TDI", 105, 110],
        ["2.0 TDI", 150, 184],
      ]),
      generation("KL", "KL · 4. nesil", 2020, 2026, hatch, [
        ["1.0 TSI", 110],
        ["1.5 TSI", 130, 150],
        ["2.0 TDI", 115, 150],
      ]),
    ]),
  ]),
  brand("Škoda", [
    model("Fabia", [
      generation("6Y", "6Y · 1. nesil", 1999, 2007, hatch, [
        ["1.2 HTP", 54, 64],
        ["1.4 MPI", 68, 75, 101],
        ["1.4 TDI", 70, 80],
      ]),
      generation("5J", "5J · 2. nesil", 2007, 2014, hatch, [
        ["1.2 HTP", 60, 70],
        ["1.2 TSI", 86, 105],
        ["1.6 TDI", 75, 90, 105],
      ]),
      generation("NJ", "NJ · 3. nesil", 2014, 2021, hatch, [
        ["1.0 MPI", 60, 75],
        ["1.0 TSI", 95, 110],
        ["1.4 TDI", 90, 105],
      ]),
      generation("PJ", "PJ · 4. nesil", 2021, 2026, hatch, [
        ["1.0 MPI", 65, 80],
        ["1.0 TSI", 95, 110],
      ]),
    ]),
    model("Octavia", [
      generation("1U", "1U · 1. nesil", 1996, 2010, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.6 MPI", 75, 102],
        ["1.9 TDI", 90, 110, 130],
      ]),
      generation("1Z", "1Z · 2. nesil", 2004, 2013, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.6 MPI", 102],
        ["1.4 TSI", 122],
        ["1.6 TDI", 105],
        ["1.9 TDI", 105],
      ]),
      generation("5E", "5E · 3. nesil", 2013, 2020, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.0 TSI", 115],
        ["1.4 TSI", 140, 150],
        ["1.6 TDI", 110],
        ["2.0 TDI", 150],
      ]),
      generation("NX", "NX · 4. nesil", 2020, 2026, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.0 TSI", 110],
        ["1.5 TSI", 150],
        ["2.0 TDI", 150],
      ]),
    ]),
    model("Superb", [
      generation("3T", "3T · 2. nesil", 2008, 2015, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.4 TSI", 125],
        ["1.8 TSI", 160],
        ["2.0 TDI", 140, 170],
      ]),
      generation("3V", "3V · 3. nesil", 2015, 2024, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.4 TSI", 150],
        ["1.5 TSI", 150],
        ["2.0 TDI", 150, 190],
      ]),
    ]),
  ]),
  brand("Suzuki", [
    model("Swift", [
      generation("MZ", "MZ · 3. nesil", 2004, 2010, hatch, [
        ["1.3 VVT", 92],
        ["1.5 VVT", 102],
      ]),
      generation("AZ", "AZ · 4. nesil", 2017, 2023, hatch, [
        ["1.2 Dualjet", 90],
        ["1.0 Boosterjet", 111],
        ["1.2 Dualjet Hybrid", 90],
      ]),
      generation("AOL", "AOL · 5. nesil", 2024, 2026, hatch, [
        ["1.2 Mild Hybrid", 83],
      ]),
    ]),
    model("Vitara", [
      generation("LY", "LY · 4. nesil", 2015, 2026, suv, [
        ["1.6 VVT", 120],
        ["1.4 Boosterjet", 140, 129],
        ["1.5 Strong Hybrid", 115],
      ]),
    ]),
  ]),
  brand("Tesla", [
    model("Model 3", [
      generation("3-S", "Model 3 · sedan", 2019, 2026, sedan, [
        ["Elektrik · RWD", 283, 286],
        ["Elektrik · Long Range AWD", 351, 498],
        ["Elektrik · Performance AWD", 513, 534],
      ]),
    ]),
    model("Model Y", [
      generation("Y", "Model Y · SUV", 2021, 2026, suv, [
        ["Elektrik · RWD", 299],
        ["Elektrik · Long Range AWD", 384, 514],
        ["Elektrik · Performance AWD", 534],
      ]),
    ]),
  ]),
  brand("Togg", [
    model("T10F", [
      generation("T10F", "T10F · elektrikli fastback", 2025, 2026, [
        "Fastback",
      ], [
        ["Elektrik · RWD", 218],
        ["Elektrik · AWD", 435],
      ]),
    ]),
    model("T10X", [
      generation("T10X", "T10X · elektrikli SUV", 2023, 2026, suv, [
        ["Elektrik · RWD", 218],
        ["Elektrik · AWD", 435],
      ]),
    ]),
  ]),
  brand("Toyota", [
    model("Auris", [
      generation("E150", "E150 · 1. nesil", 2006, 2012, hatch, [
        ["1.33 Dual VVT-i", 101],
        ["1.6 Valvematic", 124],
        ["1.4 D-4D", 90],
      ]),
      generation("E180", "E180 · 2. nesil", 2012, 2018, hatch, [
        ["1.33 Dual VVT-i", 99],
        ["1.6 Valvematic", 132],
        ["1.4 D-4D", 90],
        ["1.8 Hybrid", 136],
      ]),
    ]),
    model("C-HR", [
      generation("AX10", "AX10 · 1. nesil", 2016, 2023, suv, [
        ["1.2 Turbo", 116],
        ["1.8 Hybrid", 122],
        ["2.0 Hybrid", 184],
      ]),
      generation("AX20", "AX20 · 2. nesil", 2023, 2026, suv, [
        ["1.8 Hybrid", 140],
        ["2.0 Hybrid", 197],
        ["2.0 Plug-in Hybrid", 223],
      ]),
    ]),
    model("Corolla", [
      generation("E120", "E120 · 9. nesil", 2001, 2007, [
        "Sedan",
        "Hatchback",
      ], [
        ["1.4 VVT-i", 97],
        ["1.6 VVT-i", 110],
        ["1.4 D-4D", 90],
      ]),
      generation("E150", "E150 · 10. nesil", 2007, 2013, [
        "Sedan",
        "Hatchback",
      ], [
        ["1.33 Dual VVT-i", 101],
        ["1.6 Dual VVT-i", 124],
        ["1.4 D-4D", 90],
      ]),
      generation("E180", "E180 · 11. nesil", 2013, 2019, sedan, [
        ["1.33 Dual VVT-i", 99],
        ["1.6 Valvematic", 132],
        ["1.4 D-4D", 90],
      ]),
      generation("E210", "E210 · 12. nesil", 2019, 2026, [
        "Sedan",
        "Hatchback",
        "Station wagon",
      ], [
        ["1.5 Dynamic Force", 125],
        ["1.6 Valvematic", 132],
        ["1.8 Hybrid", 122, 140],
        ["1.5 D-4D", 130],
      ]),
    ]),
    model("Yaris", [
      generation("XP90", "XP90 · 2. nesil", 2005, 2011, hatch, [
        ["1.0 VVT-i", 69],
        ["1.3 VVT-i", 87, 100],
        ["1.4 D-4D", 90],
      ]),
      generation("XP130", "XP130 · 3. nesil", 2011, 2020, hatch, [
        ["1.0 VVT-i", 69, 72],
        ["1.33 Dual VVT-i", 99],
        ["1.4 D-4D", 90],
        ["1.5 Hybrid", 100, 101],
      ]),
      generation("XP210", "XP210 · 4. nesil", 2020, 2026, hatch, [
        ["1.5 Dynamic Force", 125],
        ["1.5 Hybrid", 116, 130],
      ]),
    ]),
  ]),
  brand("Volkswagen", [
    model("Caddy", [
      generation("2K", "2K · 3. nesil", 2004, 2015, [
        "Combi",
        "Panelvan",
      ], [
        ["1.6 MPI", 102],
        ["1.2 TSI", 105],
        ["1.6 TDI", 75, 102],
        ["2.0 TDI", 110, 140],
      ]),
      generation("SA", "SA · 4. nesil", 2015, 2020, [
        "Combi",
        "Panelvan",
      ], [
        ["1.0 TSI", 102],
        ["1.4 TSI", 125],
        ["2.0 TDI", 102, 150],
      ]),
      generation("SB", "SB · 5. nesil", 2020, 2026, [
        "Combi",
        "Panelvan",
      ], [
        ["1.5 TSI", 114],
        ["2.0 TDI", 102, 122],
      ]),
    ]),
    model("Golf", [
      generation("1K", "Golf 5 · 1K", 2003, 2008, hatch, [
        ["1.6 MPI", 102],
        ["1.4 TSI", 122, 140, 170],
        ["1.9 TDI", 105],
        ["2.0 TDI", 140],
      ]),
      generation("5K", "Golf 6 · 5K", 2008, 2013, hatch, [
        ["1.6 MPI", 102],
        ["1.4 TSI", 122, 160],
        ["1.6 TDI", 105],
        ["2.0 TDI", 140, 170],
      ]),
      generation("5G", "Golf 7 · 5G", 2012, 2020, hatch, [
        ["1.0 TSI", 110],
        ["1.2 TSI", 105, 110],
        ["1.4 TSI", 122, 125, 140, 150],
        ["1.6 TDI", 105, 110, 115],
        ["2.0 TDI", 150, 184],
      ]),
      generation("CD", "Golf 8 · CD", 2019, 2026, hatch, [
        ["1.0 eTSI", 110, 115],
        ["1.5 eTSI", 130, 150],
        ["2.0 TDI", 115, 150],
      ]),
    ]),
    model("Passat", [
      generation("B6", "B6 · 6. nesil", 2005, 2010, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.6 MPI", 102],
        ["1.4 TSI", 122],
        ["1.6 TDI", 105],
        ["2.0 TDI", 140, 170],
      ]),
      generation("B7", "B7 · 7. nesil", 2010, 2015, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.4 TSI", 122, 160],
        ["1.6 TDI", 105, 120],
        ["2.0 TDI", 140, 170],
      ]),
      generation("B8", "B8 · 8. nesil", 2014, 2023, [
        "Sedan",
        "Station wagon",
      ], [
        ["1.4 TSI", 125, 150],
        ["1.5 TSI", 150],
        ["1.6 TDI", 120],
        ["2.0 TDI", 150, 190],
      ]),
    ]),
    model("Polo", [
      generation("9N", "9N · 4. nesil", 2001, 2009, hatch, [
        ["1.2", 54, 64],
        ["1.4", 75, 80, 100],
        ["1.4 TDI", 70, 80],
      ]),
      generation("6R", "6R · 5. nesil", 2009, 2017, hatch, [
        ["1.0 MPI", 60, 75],
        ["1.2 TSI", 90, 105],
        ["1.4 TDI", 75, 90],
        ["1.6 TDI", 90, 105],
      ]),
      generation("AW", "AW · 6. nesil", 2017, 2026, hatch, [
        ["1.0 MPI", 65, 80],
        ["1.0 TSI", 95, 110, 115],
        ["1.6 TDI", 95],
      ]),
    ]),
    model("Tiguan", [
      generation("5N", "5N · 1. nesil", 2007, 2016, suv, [
        ["1.4 TSI", 122, 150],
        ["2.0 TSI", 170],
        ["2.0 TDI", 140, 170],
      ]),
      generation("AD1", "AD1 · 2. nesil", 2016, 2024, suv, [
        ["1.5 TSI", 130, 150],
        ["2.0 TSI", 180, 220],
        ["2.0 TDI", 150, 190],
      ]),
      generation("CT", "CT · 3. nesil", 2024, 2026, suv, [
        ["1.5 eTSI", 130, 150],
        ["2.0 TDI", 150],
      ]),
    ]),
    model("Transporter", [
      generation("T5", "T5 · 5. nesil", 2003, 2015, [
        "Panelvan",
        "Kombi",
        "Minibüs",
      ], [
        ["1.9 TDI", 84, 105],
        ["2.0 TDI", 84, 102, 140],
      ]),
      generation("T6", "T6 / T6.1 · 6. nesil", 2015, 2024, [
        "Panelvan",
        "Kombi",
        "Minibüs",
      ], [
        ["2.0 TDI", 84, 102, 150, 204],
      ]),
    ]),
  ]),
  brand("Volvo", [
    model("S60", [
      generation("P3", "P3 · 2. nesil", 2010, 2018, sedan, [
        ["T3 1.6", 150],
        ["T4 1.6", 180],
        ["D2 1.6", 115],
        ["D4 2.0", 181, 190],
      ]),
      generation("SPA", "SPA · 3. nesil", 2018, 2026, sedan, [
        ["B3 2.0", 163],
        ["B4 2.0", 197],
        ["B5 2.0", 250],
        ["T8 Plug-in Hybrid", 455],
      ]),
    ]),
    model("V40", [
      generation("P1", "P1 · hatchback", 2012, 2019, hatch, [
        ["T3 1.6", 150],
        ["T4 1.6", 180],
        ["D2 1.6", 115],
        ["D3 2.0", 150],
        ["D4 2.0", 177, 190],
      ]),
    ]),
    model("XC40", [
      generation("536", "536 · compact SUV", 2017, 2026, suv, [
        ["T2 1.5", 129],
        ["T3 1.5", 163],
        ["B3 2.0", 163],
        ["B4 2.0", 197],
        ["Elektrik", 238, 408],
      ]),
    ]),
  ]),
];

export const vehicleCatalogCoverage = {
  brandCount: vehicleCatalog.length,
  modelCount: vehicleCatalog.reduce(
    (total, manufacturer) => total + manufacturer.models.length,
    0,
  ),
  generationCount: vehicleCatalog.reduce(
    (total, manufacturer) =>
      total +
      manufacturer.models.reduce(
        (modelTotal, vehicleModel) =>
          modelTotal + vehicleModel.generations.length,
        0,
      ),
    0,
  ),
  lastYear: Math.max(
    ...vehicleCatalog.flatMap((manufacturer) =>
      manufacturer.models.flatMap((vehicleModel) =>
        vehicleModel.generations.map((item) => item.endYear),
      ),
    ),
  ),
};
