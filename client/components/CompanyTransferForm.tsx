import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  createTransferForm,
  updateTransferForm,
  uploadFormAttachment,
  type TransferFormData,
  type ShareholderInfo,
  type PSCInfo,
} from "@/lib/transfer-form";
import {
  Upload,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface CompanyTransferFormProps {
  orderId: string;
  companyId: string;
  companyName: string;
  companyNumber: string;
  country: string;
  incorporationDate: string;
  incorporationYear: number;
  onSuccess?: (form: TransferFormData) => void;
  initialForm?: TransferFormData;
  isEditing?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const LEVEL_OF_CONTROL_OPTIONS = [
  "More than 25% but not more than 50%",
  "More than 50% but not more than 75%",
  "More than 75%",
];

const COMPANY_ACTIVITIES = [
  // Section A: Agriculture, Forestry and Fishing
  {
    code: "01110",
    label:
      "01110 - Growing of cereals and other crops not elsewhere classified",
  },
  { code: "01120", label: "01120 - Growing of rice" },
  {
    code: "01130",
    label: "01130 - Growing of vegetables and melons, roots and tubers",
  },
  { code: "01140", label: "01140 - Growing of sugar cane" },
  { code: "01150", label: "01150 - Growing of tobacco" },
  { code: "01160", label: "01160 - Growing of fibre crops" },
  { code: "01190", label: "01190 - Growing of other non-perennial crops" },
  { code: "01210", label: "01210 - Growing of grapes" },
  {
    code: "01220",
    label: "01220 - Growing of tropical and subtropical fruits",
  },
  { code: "01230", label: "01230 - Growing of citrus fruits" },
  { code: "01240", label: "01240 - Growing of pome fruits and stone fruits" },
  {
    code: "01250",
    label: "01250 - Growing of other tree and shrub fruits and nuts",
  },
  { code: "01260", label: "01260 - Growing of oleaginous fruits" },
  { code: "01270", label: "01270 - Growing of beverage crops" },
  {
    code: "01280",
    label: "01280 - Growing of spices, aromatic, drug and dye plants",
  },
  { code: "01290", label: "01290 - Growing of other perennial crops" },
  { code: "01300", label: "01300 - Plant propagation" },
  { code: "01410", label: "01410 - Raising of cattle" },
  { code: "01420", label: "01420 - Raising of horses and other equines" },
  { code: "01430", label: "01430 - Raising of camels and camelids" },
  { code: "01440", label: "01440 - Raising of sheep and goats" },
  { code: "01450", label: "01450 - Raising of swine" },
  { code: "01460", label: "01460 - Raising of poultry" },
  { code: "01470", label: "01470 - Raising of other animals" },
  { code: "01500", label: "01500 - Mixed farming" },
  { code: "01610", label: "01610 - Support activities for crop production" },
  { code: "01620", label: "01620 - Support activities for animal production" },
  { code: "01630", label: "01630 - Post-harvest crop activities" },
  { code: "01640", label: "01640 - Seed processing for propagation" },
  { code: "01700", label: "01700 - Hunting, trapping and related activities" },

  // Section B: Mining and Quarrying
  { code: "05101", label: "05101 - Mining of anthracite" },
  { code: "05102", label: "05102 - Mining of bituminous coal" },
  { code: "05103", label: "05103 - Mining of sub-bituminous coal" },
  { code: "05104", label: "05104 - Mining of lignite" },
  { code: "05200", label: "05200 - Mining of crude petroleum and natural gas" },
  { code: "05900", label: "05900 - Mining support service activities" },
  { code: "06100", label: "06100 - Extraction of iron ores" },
  { code: "06210", label: "06210 - Extraction of copper ores" },
  { code: "06220", label: "06220 - Extraction of nickel ores" },
  { code: "06230", label: "06230 - Extraction of aluminium ores" },
  { code: "06240", label: "06240 - Extraction of precious metal ores" },
  {
    code: "06290",
    label: "06290 - Other mining and quarrying not elsewhere classified",
  },
  {
    code: "07100",
    label: "07100 - Quarrying of ornamental and building stone",
  },
  { code: "07210", label: "07210 - Extraction of sand and clay" },
  {
    code: "07290",
    label: "07290 - Mining and quarrying not elsewhere classified",
  },
  { code: "08110", label: "08110 - Extraction of stone, sand and clay" },
  { code: "08120", label: "08120 - Mining support activities n.e.c." },

  // Section C: Manufacturing
  { code: "10110", label: "10110 - Processing and preserving of meat" },
  { code: "10120", label: "10120 - Processing and preserving of poultry meat" },
  {
    code: "10130",
    label: "10130 - Production of meat and poultry meat products",
  },
  {
    code: "10200",
    label:
      "10200 - Processing and preserving of fish, crustaceans and molluscs",
  },
  { code: "10310", label: "10310 - Processing and preserving of potatoes" },
  { code: "10320", label: "10320 - Manufacture of fruit and vegetable juice" },
  {
    code: "10390",
    label: "10390 - Other processing and preserving of fruit and vegetables",
  },
  { code: "10410", label: "10410 - Manufacture of oils and fats" },
  {
    code: "10420",
    label: "10420 - Manufacture of margarine and similar edible fats",
  },
  { code: "10510", label: "10510 - Operation of dairies and cheese making" },
  { code: "10520", label: "10520 - Manufacture of ice cream" },
  { code: "10610", label: "10610 - Grain milling" },
  {
    code: "10620",
    label: "10620 - Manufacture of starches and starch products",
  },
  {
    code: "10710",
    label:
      "10710 - Manufacture of bread; manufacture of fresh pastry goods and cakes",
  },
  {
    code: "10720",
    label:
      "10720 - Manufacture of rusks and biscuits; manufacture of preserved pastry goods and cakes",
  },
  {
    code: "10730",
    label:
      "10730 - Manufacture of macaroni, noodles, couscous and similar farinaceous products",
  },
  { code: "10810", label: "10810 - Manufacture of sugar" },
  {
    code: "10820",
    label: "10820 - Manufacture of cocoa, chocolate and sugar confectionery",
  },
  { code: "10830", label: "10830 - Processing of tea and coffee" },
  {
    code: "10890",
    label:
      "10890 - Manufacture of other food products not elsewhere classified",
  },
  {
    code: "11010",
    label: "11010 - Distilling, rectifying and blending of spirits",
  },
  { code: "11020", label: "11020 - Manufacture of wine from grapes" },
  {
    code: "11030",
    label: "11030 - Manufacture of cider and other fruit fermented beverages",
  },
  {
    code: "11040",
    label: "11040 - Manufacture of other non-distilled fermented beverages",
  },
  { code: "11050", label: "11050 - Manufacture of beer" },
  { code: "11060", label: "11060 - Manufacture of malt" },
  {
    code: "11070",
    label:
      "11070 - Manufacture of soft drinks; production of mineral waters and other bottled waters",
  },

  // Section D: Electricity, Gas, Steam and Air Conditioning Supply
  { code: "35110", label: "35110 - Production of electricity" },
  { code: "35120", label: "35120 - Transmission of electricity" },
  { code: "35130", label: "35130 - Distribution of electricity" },
  { code: "35140", label: "35140 - Trade of electricity" },
  { code: "35210", label: "35210 - Manufacture of gas" },
  {
    code: "35220",
    label: "35220 - Distribution of gaseous fuels through mains",
  },
  { code: "35230", label: "35230 - Trade of gas through mains" },
  { code: "35240", label: "35240 - Steam and air conditioning supply" },

  // Section E: Water Supply; Sewerage, Waste Management
  { code: "36000", label: "36000 - Water collection, treatment and supply" },
  { code: "37000", label: "37000 - Sewerage" },
  { code: "38110", label: "38110 - Collection of non-hazardous waste" },
  { code: "38120", label: "38120 - Collection of hazardous waste" },
  {
    code: "38210",
    label: "38210 - Treatment and disposal of non-hazardous waste",
  },
  { code: "38220", label: "38220 - Treatment and disposal of hazardous waste" },
  { code: "38300", label: "38300 - Materials recovery and recycling" },
  {
    code: "39000",
    label: "39000 - Remediation activities and other waste management services",
  },

  // Section F: Construction
  { code: "41100", label: "41100 - Development of building projects" },
  {
    code: "41200",
    label: "41200 - Construction of residential and non-residential buildings",
  },
  { code: "42110", label: "42110 - Construction of roads and motorways" },
  { code: "42120", label: "42120 - Construction of railways" },
  { code: "42130", label: "42130 - Construction of bridges and tunnels" },
  {
    code: "42210",
    label: "42210 - Construction of utility projects for fluids",
  },
  {
    code: "42220",
    label:
      "42220 - Construction of utility projects for electricity and telecommunications",
  },
  {
    code: "42900",
    label: "42900 - Construction of other civil engineering projects",
  },
  { code: "43110", label: "43110 - Demolition and site preparation" },
  { code: "43120", label: "43120 - Test drilling and boring" },
  { code: "43210", label: "43210 - Electrical installation" },
  {
    code: "43220",
    label: "43220 - Plumbing, heat and air-conditioning installation",
  },
  { code: "43290", label: "43290 - Other construction installation" },
  { code: "43310", label: "43310 - Plastering" },
  { code: "43320", label: "43320 - Joinery installation" },
  { code: "43330", label: "43330 - Floor and wall covering" },
  { code: "43341", label: "43341 - Painting of buildings" },
  { code: "43342", label: "43342 - Finishing of buildings" },
  { code: "43390", label: "43390 - Other specialised construction activities" },
  { code: "43410", label: "43410 - Roofing activities" },
  {
    code: "43990",
    label:
      "43990 - Other specialised construction activities not elsewhere classified",
  },

  // Section G: Wholesale and Retail Trade
  { code: "45110", label: "45110 - Sale of cars and light motor vehicles" },
  { code: "45190", label: "45190 - Sale of other motor vehicles" },
  { code: "45200", label: "45200 - Maintenance and repair of motor vehicles" },
  {
    code: "45310",
    label: "45310 - Wholesale trade of motor vehicle parts and accessories",
  },
  {
    code: "45320",
    label: "45320 - Retail trade of motor vehicle parts and accessories",
  },
  {
    code: "45400",
    label:
      "45400 - Sale, maintenance and repair of motorcycles and related parts and accessories",
  },
  {
    code: "46110",
    label:
      "46110 - Agents selling agricultural raw materials, live animals, textile raw materials and semi-finished goods",
  },
  {
    code: "46190",
    label:
      "46190 - Agents specialising in the sale of other particular products",
  },
  {
    code: "46210",
    label:
      "46210 - Wholesale trade of grain, unmanufactured tobacco, seeds and animal feeds",
  },
  { code: "46220", label: "46220 - Wholesale trade of flowers and plants" },
  { code: "46230", label: "46230 - Wholesale trade of live animals" },
  { code: "46240", label: "46240 - Wholesale trade of hides, skins and furs" },
  { code: "46310", label: "46310 - Wholesale trade of fruit and vegetables" },
  { code: "46320", label: "46320 - Wholesale trade of meat and meat products" },
  {
    code: "46330",
    label:
      "46330 - Wholesale trade of dairy products, eggs and edible oils and fats",
  },
  {
    code: "46340",
    label:
      "46340 - Wholesale trade of food, beverages and tobacco (non-specialised)",
  },
  {
    code: "46360",
    label: "46360 - Wholesale trade of sugar and sugar confectionery",
  },
  {
    code: "46371",
    label: "46371 - Wholesale trade of coffee, tea, cocoa and spices",
  },
  {
    code: "46372",
    label:
      "46372 - Wholesale trade of other food including fish, crustaceans and molluscs (non-specialised)",
  },
  {
    code: "46390",
    label:
      "46390 - Non-specialised wholesale trade of food, beverages and tobacco",
  },
  { code: "46410", label: "46410 - Wholesale trade of textiles" },
  { code: "46420", label: "46420 - Wholesale trade of clothing and footwear" },
  {
    code: "46430",
    label:
      "46430 - Wholesale trade of electrical household appliances and sanitary ware",
  },
  {
    code: "46440",
    label:
      "46440 - Wholesale trade of china and glassware and cleaning materials",
  },
  { code: "46450", label: "46450 - Wholesale trade of perfume and cosmetics" },
  { code: "46460", label: "46460 - Wholesale trade of pharmaceutical goods" },
  {
    code: "46470",
    label:
      "46470 - Wholesale trade of furniture, carpets and lighting equipment",
  },
  { code: "46480", label: "46480 - Wholesale trade of watches and jewellery" },
  { code: "46490", label: "46490 - Wholesale trade of other household goods" },
  {
    code: "46500",
    label:
      "46500 - Wholesale trade of machinery, equipment and supplies (non-specialised)",
  },
  {
    code: "46510",
    label:
      "46510 - Wholesale trade of computer, computer peripheral equipment and software",
  },
  {
    code: "46520",
    label:
      "46520 - Wholesale trade of electronic and telecommunications equipment and parts",
  },
  { code: "46610", label: "46610 - Wholesale trade of machine tools" },
  {
    code: "46620",
    label:
      "46620 - Wholesale trade of mining, quarrying and construction machinery",
  },
  { code: "46630", label: "46630 - Wholesale trade of forestry machinery" },
  {
    code: "46640",
    label:
      "46640 - Wholesale trade of machinery for the textile industry and sewing and knitting machines",
  },
  { code: "46650", label: "46650 - Wholesale trade of trucks and lorries" },
  {
    code: "46660",
    label: "46660 - Wholesale trade of other machinery and equipment",
  },
  { code: "46690", label: "46690 - Wholesale trade of waste and scrap" },
  {
    code: "46710",
    label:
      "46710 - Agents involved in the sale of machinery, equipment, minerals and metals",
  },
  {
    code: "46720",
    label:
      "46720 - Agents involved in the sale of furniture, household and cutlery goods",
  },
  {
    code: "46730",
    label:
      "46730 - Agents involved in the sale of textiles, clothing, fur, footwear and leather goods",
  },
  {
    code: "46740",
    label: "46740 - Agents involved in the sale of food, beverages and tobacco",
  },
  {
    code: "46750",
    label:
      "46750 - Agents in the sale of pharmaceutical and medical goods, cosmetics and toilet preparations",
  },
  { code: "46900", label: "46900 - Non-specialised wholesale trade" },
  {
    code: "47110",
    label:
      "47110 - Retail sale in non-specialised stores with food, beverages or tobacco predominating",
  },
  {
    code: "47190",
    label: "47190 - Other retail sale in non-specialised stores",
  },
  { code: "47210", label: "47210 - Retail sale of fruit and vegetables" },
  { code: "47220", label: "47220 - Retail sale of meat and meat products" },
  {
    code: "47230",
    label: "47230 - Retail sale of fish, crustaceans and molluscs",
  },
  {
    code: "47240",
    label:
      "47240 - Retail sale of bread, cakes, flour confectionery and sugar confectionery",
  },
  { code: "47250", label: "47250 - Retail sale of alcoholic beverages" },
  { code: "47260", label: "47260 - Retail sale of tobacco products" },
  {
    code: "47290",
    label:
      "47290 - Other retail sale of food, beverages and tobacco in specialised stores",
  },
  { code: "47300", label: "47300 - Retail sale of automotive fuel" },
  {
    code: "47410",
    label: "47410 - Retail sale of books, newspapers and stationery",
  },
  {
    code: "47420",
    label:
      "47420 - Retail sale of music and video recordings in specialised stores",
  },
  { code: "47430", label: "47430 - Retail sale of sports equipment" },
  { code: "47440", label: "47440 - Retail sale of games and toys" },
  { code: "47450", label: "47450 - Retail sale of household appliances" },
  { code: "47460", label: "47460 - Retail sale of hardware, paints and glass" },
  { code: "47470", label: "47470 - Retail sale of clothing" },
  { code: "47480", label: "47480 - Retail sale of shoes and leather goods" },
  {
    code: "47490",
    label: "47490 - Retail sale of furniture, carpets and lighting",
  },
  {
    code: "47500",
    label:
      "47500 - Retail sale of electrical household appliances and radio and television goods",
  },
  {
    code: "47590",
    label: "47590 - Retail sale of other household equipment and furnishings",
  },
  {
    code: "47610",
    label: "47610 - Retail sale of books in specialised stores",
  },
  { code: "47620", label: "47620 - Retail sale of newspapers and stationery" },
  { code: "47630", label: "47630 - Retail sale of music and video recordings" },
  { code: "47640", label: "47640 - Retail sale of sporting equipment" },
  { code: "47650", label: "47650 - Retail sale of games and toys" },
  {
    code: "47710",
    label: "47710 - Retail sale of clothing, footwear and leather goods",
  },
  {
    code: "47720",
    label: "47720 - Retail sale of cosmetic and toilet articles",
  },
  {
    code: "47730",
    label:
      "47730 - Retail sale of flowers, plants, seeds, fertilisers, pet animals and pet food and supplies",
  },
  { code: "47740", label: "47740 - Retail sale of bicycles" },
  {
    code: "47750",
    label: "47750 - Retail sale of articles in second-hand shops",
  },
  {
    code: "47760",
    label:
      "47760 - Retail sale via stalls and markets of food, beverages and tobacco products",
  },
  {
    code: "47770",
    label:
      "47770 - Retail sale via stalls and markets of clothing and footwear",
  },
  { code: "47780", label: "47780 - Other retail sale via stalls and markets" },
  {
    code: "47800",
    label: "47800 - Retail sale via mail order houses or via Internet",
  },
  {
    code: "47900",
    label: "47900 - Other retail trade not in stores, stalls or markets",
  },

  // Section H: Transportation and Storage
  { code: "49100", label: "49100 - Passenger rail transport, interurban" },
  { code: "49200", label: "49200 - Freight rail transport" },
  {
    code: "49310",
    label: "49310 - Urban and suburban passenger rail transport",
  },
  { code: "49320", label: "49320 - Other passenger land transport" },
  {
    code: "49410",
    label: "49410 - Freight transport by road and removal services",
  },
  { code: "49420", label: "49420 - Taxi operation" },
  {
    code: "49430",
    label: "49430 - Passenger road transport, other than taxi or bus",
  },
  { code: "49500", label: "49500 - Transport via pipeline" },
  { code: "50100", label: "50100 - Sea and coastal passenger water transport" },
  { code: "50200", label: "50200 - Sea and coastal freight water transport" },
  { code: "50300", label: "50300 - Inland passenger water transport" },
  { code: "50400", label: "50400 - Inland freight water transport" },
  { code: "51101", label: "51101 - Scheduled air transport of passengers" },
  { code: "51102", label: "51102 - Non-scheduled air transport of passengers" },
  { code: "51210", label: "51210 - Scheduled air transport of freight" },
  { code: "51220", label: "51220 - Non-scheduled air transport of freight" },
  {
    code: "52101",
    label:
      "52101 - Operation of warehousing and storage facilities for water transport activities",
  },
  {
    code: "52102",
    label:
      "52102 - Operation of warehousing and storage facilities for air transport activities",
  },
  {
    code: "52103",
    label:
      "52103 - Operation of warehousing and storage facilities for land transport activities",
  },
  {
    code: "52104",
    label:
      "52104 - Operation of warehousing and storage facilities for other transport activities",
  },
  {
    code: "52210",
    label: "52210 - Service activities incidental to air transport",
  },
  {
    code: "52220",
    label: "52220 - Service activities incidental to water transport",
  },
  {
    code: "52230",
    label: "52230 - Service activities incidental to land transport",
  },
  {
    code: "52240",
    label: "52240 - Service activities incidental to pipeline transport",
  },
  {
    code: "52290",
    label: "52290 - Other service activities incidental to transport",
  },
  {
    code: "53100",
    label: "53100 - Postal activities under universal service obligation",
  },
  { code: "53200", label: "53200 - Other postal and courier activities" },

  // Section I: Accommodation and Food Service
  { code: "55100", label: "55100 - Hotels and similar accommodation" },
  {
    code: "55201",
    label: "55201 - Holiday and other short-stay accommodation",
  },
  {
    code: "55202",
    label:
      "55202 - Camping grounds, recreational vehicle parks and trailer parks",
  },
  { code: "55203", label: "55203 - Other accommodation" },
  { code: "55300", label: "55300 - Food and beverage service activities" },
  { code: "55301", label: "55301 - Restaurants" },
  { code: "55302", label: "55302 - Cafes and bars" },
  { code: "55303", label: "55303 - Catering" },

  // Section J: Information and Communication
  {
    code: "58110",
    label: "58110 - Publishing of books, brochures and other publications",
  },
  { code: "58120", label: "58120 - Publishing of newspapers" },
  { code: "58130", label: "58130 - Publishing of journals and periodicals" },
  { code: "58140", label: "58140 - Publishing of recorded media" },
  { code: "58190", label: "58190 - Other publishing activities" },
  { code: "58210", label: "58210 - Software publishing" },
  {
    code: "59110",
    label:
      "59110 - Motion picture, video and television programme production activities",
  },
  {
    code: "59120",
    label:
      "59120 - Motion picture, video and television programme post-production activities",
  },
  {
    code: "59130",
    label:
      "59130 - Motion picture, video and television programme distribution activities",
  },
  { code: "59140", label: "59140 - Projection of motion pictures" },
  {
    code: "59200",
    label: "59200 - Sound recording and music publishing activities",
  },
  { code: "60100", label: "60100 - Radio broadcasting" },
  {
    code: "60200",
    label: "60200 - Television programming and broadcasting activities",
  },
  { code: "61100", label: "61100 - Wired telecommunications activities" },
  { code: "61200", label: "61200 - Wireless telecommunications activities" },
  { code: "61300", label: "61300 - Satellite telecommunications activities" },
  { code: "61900", label: "61900 - Other telecommunications activities" },
  {
    code: "62010",
    label: "62010 - Business and other management consultancy activities",
  },
  { code: "62020", label: "62020 - Computer facilities management activities" },
  {
    code: "62090",
    label:
      "62090 - Other information technology and computer service activities",
  },
  {
    code: "63110",
    label: "63110 - Data processing, hosting and related activities",
  },
  { code: "63120", label: "63120 - Web portals" },
  { code: "63910", label: "63910 - News agency activities" },
  {
    code: "63990",
    label:
      "63990 - Other information service activities not elsewhere classified",
  },
];

export function CompanyTransferForm({
  orderId,
  companyId,
  companyName,
  companyNumber,
  country,
  incorporationDate,
  incorporationYear,
  onSuccess,
  initialForm,
  isEditing = false,
}: CompanyTransferFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<TransferFormData | null>(
    null,
  );
  const [activitiesSearchTerm, setActivitiesSearchTerm] = useState("");

  // Load existing form data when in edit/amend mode
  useEffect(() => {
    if (!initialForm && isEditing && companyId) {
      setLoading(true);
      fetch(`/api/transfer-forms?companyId=${companyId}`)
        .then((res) => res.json())
        .then((forms) => {
          if (forms[0]) {
            setFormData(forms[0]);
          }
        })
        .catch((err) => console.error("Error loading transfer form:", err))
        .finally(() => setLoading(false));
    }
  }, [companyId, isEditing, initialForm]);

  const [formData, setFormData] = useState<Partial<TransferFormData>>(
    initialForm || {
      orderId,
      companyId,
      companyName,
      companyNumber,
      country,
      incorporationDate,
      incorporationYear,

      totalShares: 0,
      totalShareCapital: 0,
      pricePerShare: 0,

      shareholders: [],
      numberOfShareholders: 0,

      pscList: [],
      numberOfPSCs: 0,

      changeCompanyName: false,
      suggestedNames: ["", "", ""],
      changeCompanyActivities: false,
      companyActivities: [],

      status: "under-review",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      amendmentsRequiredCount: 0,
      attachments: [],
      comments: [],
      statusHistory: [],
    },
  );

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    // Step 1 (Company Info) - Auto-filled, no validation needed
    if (step === 1) {
      // Company info is auto-filled and non-editable, so no validation
    }

    // Step 2 (Shares Info)
    if (step === 2) {
      if (!formData.totalShares || formData.totalShares <= 0) {
        newErrors.totalShares = "Total shares must be greater than 0";
      }
      if (!formData.totalShareCapital || formData.totalShareCapital <= 0) {
        newErrors.totalShareCapital =
          "Total share capital must be greater than 0";
      }
    }

    // Step 3 (Shareholders)
    if (step === 3) {
      if (
        !formData.numberOfShareholders ||
        formData.numberOfShareholders <= 0
      ) {
        newErrors.numberOfShareholders =
          "Number of shareholders must be greater than 0";
      }
      if (formData.shareholders && formData.shareholders.length > 0) {
        const totalPercentage = formData.shareholders.reduce(
          (sum, s) => sum + (s.shareholderPercentage || 0),
          0,
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          newErrors.shareholders = `Shareholder percentages must equal 100% (current: ${totalPercentage.toFixed(2)}%)`;
        }
        formData.shareholders.forEach((s, i) => {
          if (!s.name) newErrors[`shareholder_${i}_name`] = "Name is required";
          if (!s.nationality)
            newErrors[`shareholder_${i}_nationality`] =
              "Nationality is required";
          if (!s.address)
            newErrors[`shareholder_${i}_address`] = "Address is required";
          if (!s.city) newErrors[`shareholder_${i}_city`] = "City is required";
          if (!s.country)
            newErrors[`shareholder_${i}_country`] = "Country is required";
          if (!s.shareholderPercentage || s.shareholderPercentage <= 0) {
            newErrors[`shareholder_${i}_percentage`] =
              "Percentage must be greater than 0";
          }
        });
      }
    }

    // Step 4 (PSC)
    if (step === 4) {
      if (formData.numberOfPSCs && formData.numberOfPSCs > 0) {
        if (
          !formData.numberOfShareholders ||
          formData.numberOfPSCs > formData.numberOfShareholders
        ) {
          newErrors.numberOfPSCs =
            "Number of PSCs cannot exceed number of shareholders";
        }
        formData.pscList?.forEach((p, i) => {
          if (!p.shareholderId)
            newErrors[`psc_${i}_shareholder`] =
              "Shareholder selection is required";
          if (!p.levelOfControl || p.levelOfControl.length === 0) {
            newErrors[`psc_${i}_control`] = "Level of control is required";
          }
        });
      }
    }

    // Step 5 (Updates)
    if (step === 5) {
      if (formData.changeCompanyName) {
        const names = formData.suggestedNames?.filter((n) => n && n.trim());
        if (!names || names.length === 0) {
          newErrors.suggestedNames = "At least one suggested name is required";
        }
      }
      if (formData.changeCompanyActivities) {
        if (
          !formData.companyActivities ||
          formData.companyActivities.length === 0
        ) {
          newErrors.companyActivities = "Select at least one company activity";
        }
        if (
          formData.companyActivities &&
          formData.companyActivities.length > 4
        ) {
          newErrors.companyActivities = "Maximum 4 activities allowed";
        }
      }
    }

    // Step 6 (Documents)
    if (step === 6) {
      if (!formData.attachments || formData.attachments.length === 0) {
        newErrors.attachments = "At least one document is required";
      }
    }

    // Step 7 (Review) - No validation, just confirmation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      // Provide specific error feedback
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]);
      } else {
        toast.error("Please fix the errors before proceeding");
      }
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = () => {
          const newAttachment = {
            id: `att_${Date.now()}_${i}`,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedDate: new Date().toISOString(),
            uploadedBy: "user",
          };
          setFormData((prev) => ({
            ...prev,
            attachments: [...(prev.attachments || []), newAttachment],
          }));
        };
        reader.readAsDataURL(file);
      }
      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter(
        (a) => a.id !== attachmentId,
      ),
    }));
  };

  const updateShareholder = (
    index: number,
    field: keyof ShareholderInfo,
    value: any,
  ) => {
    const shareholders = [...(formData.shareholders || [])];
    shareholders[index] = { ...shareholders[index], [field]: value };

    if (
      field === "shareholderPercentage" &&
      formData.totalShares &&
      formData.totalShareCapital
    ) {
      const percentage = shareholders[index].shareholderPercentage || 0;
      shareholders[index].shares = Math.round(
        (formData.totalShares * percentage) / 100,
      );
      shareholders[index].amount =
        (formData.totalShareCapital * percentage) / 100;
    }

    setFormData((prev) => ({
      ...prev,
      shareholders,
    }));
  };

  const addShareholder = () => {
    const newShareholder: ShareholderInfo = {
      id: `shareholder_${Date.now()}`,
      name: "",
      nationality: "",
      address: "",
      city: "",
      country: "",
      shareholderPercentage: 0,
      shares: 0,
      amount: 0,
    };
    setFormData((prev) => ({
      ...prev,
      shareholders: [...(prev.shareholders || []), newShareholder],
    }));
  };

  const removeShareholder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: (prev.shareholders || []).filter((_, i) => i !== index),
    }));
  };

  const updatePSC = (index: number, field: keyof PSCInfo, value: any) => {
    const pscList = [...(formData.pscList || [])];
    pscList[index] = { ...pscList[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      pscList,
    }));
  };

  const addPSC = () => {
    const newPSC: PSCInfo = {
      id: `psc_${Date.now()}`,
      shareholderId: "",
      shareholderName: "",
      nationality: "",
      address: "",
      city: "",
      country: "",
      levelOfControl: [],
    };
    setFormData((prev) => ({
      ...prev,
      pscList: [...(prev.pscList || []), newPSC],
    }));
  };

  const removePSC = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pscList: (prev.pscList || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);
    try {
      // Set status to "under-review" when submitting
      const dataToSubmit = {
        ...formData,
        status: "under-review" as const,
      };

      const result =
        isEditing && initialForm?.id
          ? await updateTransferForm(initialForm.id, dataToSubmit)
          : await createTransferForm(
              dataToSubmit as Omit<
                TransferFormData,
                "id" | "createdAt" | "updatedAt"
              >,
            );

      if (result) {
        setSubmittedForm(result);
        setShowSuccessDialog(true);
        if (onSuccess) onSuccess(result);
        toast.success(
          isEditing
            ? "Form updated successfully and is now under review"
            : "Form submitted successfully and is now under review",
        );
      } else {
        toast.error("Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          Auto-filled from company details (non-editable)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Company Name</Label>
            <Input value={companyName} disabled />
          </div>
          <div>
            <Label>Company Number</Label>
            <Input value={companyNumber} disabled />
          </div>
          <div>
            <Label>Incorporation Date</Label>
            <Input value={incorporationDate} disabled />
          </div>
          <div>
            <Label>Incorporation Year</Label>
            <Input value={incorporationYear} disabled />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSharesInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company Shares Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Total Shares *</Label>
            <Input
              type="number"
              min="1"
              value={formData.totalShares || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totalShares: parseFloat(e.target.value) || 0,
                })
              }
            />
            {errors.totalShares && (
              <p className="text-red-600 text-sm mt-1">{errors.totalShares}</p>
            )}
          </div>
          <div>
            <Label>Total Share Capital (£) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.totalShareCapital || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totalShareCapital: parseFloat(e.target.value) || 0,
                })
              }
            />
            {errors.totalShareCapital && (
              <p className="text-red-600 text-sm mt-1">
                {errors.totalShareCapital}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label>Price per Share (Auto-calculated) *</Label>
          <Input
            type="number"
            value={
              formData.totalShares &&
              formData.totalShareCapital &&
              formData.totalShares > 0
                ? (formData.totalShares ? (formData.totalShareCapital / formData.totalShares) : 0).toFixed(2)
                : "0.00"
            }
            disabled
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderShareholders = () => (
    <Card>
      <CardHeader>
        <CardTitle>Shareholders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>How many shareholders? *</Label>
          <Input
            type="number"
            min="1"
            value={formData.numberOfShareholders || ""}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 0;
              setFormData({ ...formData, numberOfShareholders: num });
              const currentCount = (formData.shareholders || []).length;
              if (num > currentCount) {
                const newShareholders = [...(formData.shareholders || [])];
                for (let i = currentCount; i < num; i++) {
                  newShareholders.push({
                    id: `shareholder_${Date.now()}_${i}`,
                    name: "",
                    nationality: "",
                    address: "",
                    city: "",
                    country: "",
                    shareholderPercentage: 0,
                    shares: 0,
                    amount: 0,
                  });
                }
                setFormData({
                  ...formData,
                  numberOfShareholders: num,
                  shareholders: newShareholders,
                });
              } else if (num < currentCount) {
                const newShareholders = (formData.shareholders || []).slice(
                  0,
                  num,
                );
                setFormData({
                  ...formData,
                  numberOfShareholders: num,
                  shareholders: newShareholders,
                });
              }
            }}
          />
          {errors.numberOfShareholders && (
            <p className="text-red-600 text-sm mt-1">
              {errors.numberOfShareholders}
            </p>
          )}
        </div>

        {errors.shareholders && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.shareholders}
            </p>
          </div>
        )}

        {/* Shareholder Percentage Summary */}
        {(formData.shareholders || []).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-semibold">
                  Total Shareholder %
                </p>
                <p
                  className={`text-2xl font-bold ${
                    Math.abs(
                      (formData.shareholders || []).reduce(
                        (sum, s) => sum + (s.shareholderPercentage || 0),
                        0,
                      ) - 100,
                    ) < 0.01
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(formData.shareholders || [])
                    .reduce((sum, s) => sum + (s.shareholderPercentage || 0), 0)
                    .toFixed(2)}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-semibold">Target</p>
                <p className="text-2xl font-bold text-blue-600">100%</p>
              </div>
            </div>
            {Math.abs(
              (formData.shareholders || []).reduce(
                (sum, s) => sum + (s.shareholderPercentage || 0),
                0,
              ) - 100,
            ) > 0.01 && (
              <p className="text-sm text-red-600 mt-2">
                ⚠�� Percentages must add up to exactly 100%
              </p>
            )}
          </div>
        )}

        {(formData.shareholders || []).map((shareholder, index) => (
          <Card key={shareholder.id} className="p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold">Shareholder {index + 1}</h4>
              {(formData.shareholders || []).length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeShareholder(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={shareholder.name}
                  onChange={(e) =>
                    updateShareholder(index, "name", e.target.value)
                  }
                />
                {errors[`shareholder_${index}_name`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`shareholder_${index}_name`]}
                  </p>
                )}
              </div>
              <div>
                <Label>Nationality *</Label>
                <Input
                  value={shareholder.nationality}
                  onChange={(e) =>
                    updateShareholder(index, "nationality", e.target.value)
                  }
                />
                {errors[`shareholder_${index}_nationality`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`shareholder_${index}_nationality`]}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Address *</Label>
                <Input
                  value={shareholder.address}
                  onChange={(e) =>
                    updateShareholder(index, "address", e.target.value)
                  }
                />
                {errors[`shareholder_${index}_address`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`shareholder_${index}_address`]}
                  </p>
                )}
              </div>
              <div>
                <Label>City *</Label>
                <Input
                  value={shareholder.city}
                  onChange={(e) =>
                    updateShareholder(index, "city", e.target.value)
                  }
                />
                {errors[`shareholder_${index}_city`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`shareholder_${index}_city`]}
                  </p>
                )}
              </div>
              <div>
                <Label>Country *</Label>
                <Input
                  value={shareholder.country}
                  onChange={(e) =>
                    updateShareholder(index, "country", e.target.value)
                  }
                />
                {errors[`shareholder_${index}_country`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`shareholder_${index}_country`]}
                  </p>
                )}
              </div>
              <div>
                <Label>Shareholder Percentage (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={shareholder.shareholderPercentage}
                  onChange={(e) =>
                    updateShareholder(
                      index,
                      "shareholderPercentage",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
                {errors[`shareholder_${index}_percentage`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`shareholder_${index}_percentage`]}
                  </p>
                )}
              </div>
              <div>
                <Label>Shares (Auto-calculated)</Label>
                <Input
                  type="number"
                  value={Math.round(shareholder.shares)}
                  disabled
                />
              </div>
              <div>
                <Label>Amount £ (Auto-calculated)</Label>
                <Input
                  type="number"
                  value={(shareholder.amount || 0).toFixed(2)}
                  disabled
                />
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  const renderPSC = () => (
    <Card>
      <CardHeader>
        <CardTitle>Persons with Significant Control (PSC)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>How many PSCs? *</Label>
          <Input
            type="number"
            min="0"
            max={formData.numberOfShareholders || 0}
            value={formData.numberOfPSCs || ""}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 0;
              setFormData({ ...formData, numberOfPSCs: num });
              const currentCount = (formData.pscList || []).length;
              if (num > currentCount) {
                const newPSCs = [...(formData.pscList || [])];
                for (let i = currentCount; i < num; i++) {
                  newPSCs.push({
                    id: `psc_${Date.now()}_${i}`,
                    shareholderId: "",
                    shareholderName: "",
                    nationality: "",
                    address: "",
                    city: "",
                    country: "",
                    levelOfControl: [],
                  });
                }
                setFormData({
                  ...formData,
                  numberOfPSCs: num,
                  pscList: newPSCs,
                });
              } else if (num < currentCount) {
                const newPSCs = (formData.pscList || []).slice(0, num);
                setFormData({
                  ...formData,
                  numberOfPSCs: num,
                  pscList: newPSCs,
                });
              }
            }}
          />
          {errors.numberOfPSCs && (
            <p className="text-red-600 text-sm mt-1">{errors.numberOfPSCs}</p>
          )}
        </div>

        {(formData.pscList || []).map((psc, index) => (
          <Card key={psc.id} className="p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold">PSC {index + 1}</h4>
              {(formData.pscList || []).length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePSC(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Select Shareholder *</Label>
                <Select
                  value={psc.shareholderId || ""}
                  onValueChange={(value) => {
                    const selected = (formData.shareholders || []).find(
                      (s) => s.id === value,
                    );
                    const pscList = [...(formData.pscList || [])];
                    pscList[index] = {
                      ...pscList[index],
                      shareholderId: value,
                      shareholderName: selected?.name || "",
                      nationality: selected?.nationality || "",
                      address: selected?.address || "",
                      city: selected?.city || "",
                      country: selected?.country || "",
                    };
                    setFormData((prev) => ({
                      ...prev,
                      pscList,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shareholder" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.shareholders || []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[`psc_${index}_shareholder`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`psc_${index}_shareholder`]}
                  </p>
                )}
              </div>
              <div>
                <Label>Level of Control (Multi-select) *</Label>
                <div className="space-y-2">
                  {LEVEL_OF_CONTROL_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={psc.levelOfControl?.includes(option) || false}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...(psc.levelOfControl || []), option]
                            : (psc.levelOfControl || []).filter(
                                (l) => l !== option,
                              );
                          updatePSC(index, "levelOfControl", updated);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
                {errors[`psc_${index}_control`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`psc_${index}_control`]}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  const renderCompanyUpdates = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Name Change</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.changeCompanyName}
                onChange={() =>
                  setFormData({ ...formData, changeCompanyName: false })
                }
                className="mr-2"
              />
              <span>No</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.changeCompanyName}
                onChange={() =>
                  setFormData({ ...formData, changeCompanyName: true })
                }
                className="mr-2"
              />
              <span>Yes</span>
            </label>
          </div>
          {formData.changeCompanyName && (
            <div className="space-y-2">
              <Label>Suggested Names (3 required) *</Label>
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  placeholder={`Suggested name ${i + 1}`}
                  value={formData.suggestedNames?.[i] || ""}
                  onChange={(e) => {
                    const names = [
                      ...(formData.suggestedNames || ["", "", ""]),
                    ];
                    names[i] = e.target.value;
                    setFormData({ ...formData, suggestedNames: names });
                  }}
                />
              ))}
              {errors.suggestedNames && (
                <p className="text-red-600 text-sm">{errors.suggestedNames}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Activities Change</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.changeCompanyActivities}
                onChange={() =>
                  setFormData({ ...formData, changeCompanyActivities: false })
                }
                className="mr-2"
              />
              <span>No</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.changeCompanyActivities}
                onChange={() =>
                  setFormData({ ...formData, changeCompanyActivities: true })
                }
                className="mr-2"
              />
              <span>Yes</span>
            </label>
          </div>
          {formData.changeCompanyActivities && (
            <div className="space-y-3">
              <Label>Select Activities (Max 4) *</Label>

              {/* Search Input */}
              <Input
                placeholder="Search activities by code or description..."
                value={activitiesSearchTerm}
                onChange={(e) => setActivitiesSearchTerm(e.target.value)}
                className="w-full"
              />

              {/* Selected Activities Count */}
              <div className="text-sm text-gray-600">
                Selected:{" "}
                <span className="font-semibold">
                  {(formData.companyActivities || []).length}/4
                </span>
              </div>

              {/* Activities List */}
              <div className="max-h-96 overflow-y-auto border border-border/40 rounded-lg p-4 bg-gray-50">
                {COMPANY_ACTIVITIES.filter(
                  (activity) =>
                    activity.code.includes(
                      activitiesSearchTerm.toUpperCase(),
                    ) ||
                    activity.label
                      .toLowerCase()
                      .includes(activitiesSearchTerm.toLowerCase()),
                ).length > 0 ? (
                  <div className="space-y-2">
                    {COMPANY_ACTIVITIES.filter(
                      (activity) =>
                        activity.code.includes(
                          activitiesSearchTerm.toUpperCase(),
                        ) ||
                        activity.label
                          .toLowerCase()
                          .includes(activitiesSearchTerm.toLowerCase()),
                    ).map((activity) => (
                      <label
                        key={activity.code}
                        className="flex items-start p-2 hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(formData.companyActivities || []).includes(
                            activity.code,
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (
                                (formData.companyActivities || []).length < 4
                              ) {
                                setFormData({
                                  ...formData,
                                  companyActivities: [
                                    ...(formData.companyActivities || []),
                                    activity.code,
                                  ],
                                });
                              } else {
                                toast.error("Maximum 4 activities allowed");
                              }
                            } else {
                              setFormData({
                                ...formData,
                                companyActivities: (
                                  formData.companyActivities || []
                                ).filter((a) => a !== activity.code),
                              });
                            }
                          }}
                          className="mr-3 mt-1 flex-shrink-0"
                          disabled={
                            (formData.companyActivities || []).length >= 4 &&
                            !(formData.companyActivities || []).includes(
                              activity.code,
                            )
                          }
                        />
                        <span className="text-sm">{activity.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No activities found matching "{activitiesSearchTerm}"
                  </p>
                )}
              </div>

              {/* Selected Activities Display */}
              {(formData.companyActivities || []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Selected Activities:</Label>
                  <div className="flex flex-wrap gap-2">
                    {(formData.companyActivities || []).map((code) => {
                      const activity = COMPANY_ACTIVITIES.find(
                        (a) => a.code === code,
                      );
                      return (
                        <div
                          key={code}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{activity?.label}</span>
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                companyActivities: (
                                  formData.companyActivities || []
                                ).filter((a) => a !== code),
                              });
                            }}
                            className="text-blue-600 hover:text-blue-900 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {errors.companyActivities && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.companyActivities}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <Card>
      <CardHeader>
        <CardTitle>Shareholder Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploadingFile}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Drag and drop files or click to select
            </p>
          </label>
        </div>

        {(formData.attachments || []).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Uploaded Files:</h4>
            {(formData.attachments || []).map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{attachment.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {errors.attachments && (
          <p className="text-red-600 text-sm">{errors.attachments}</p>
        )}
      </CardContent>
    </Card>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review & Confirm</CardTitle>
          <CardDescription>
            Please review all the information you've provided. You won't be able
            to edit after submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              ℹ️ Please carefully review all the information below before
              confirming your submission.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Company Name</Label>
              <p className="font-semibold mt-1">{formData.companyName}</p>
            </div>
            <div>
              <Label className="text-gray-600">Company Number</Label>
              <p className="font-semibold mt-1">
                {formData.companyNumber || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Incorporation Date</Label>
              <p className="font-semibold mt-1">
                {formData.incorporationDate || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Incorporation Year</Label>
              <p className="font-semibold mt-1">{formData.incorporationYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shares Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shares Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Total Shares</Label>
              <p className="font-semibold mt-1">{formData.totalShares}</p>
            </div>
            <div>
              <Label className="text-gray-600">Share Capital</Label>
              <p className="font-semibold mt-1">
                £{formData.totalShareCapital?.toFixed(2)}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Price per Share</Label>
              <p className="font-semibold mt-1">
                £
                {formData.totalShareCapital && formData.totalShares
                  ? (formData.totalShareCapital / formData.totalShares).toFixed(
                      2,
                    )
                  : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shareholders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Shareholders ({formData.numberOfShareholders})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(formData.shareholders || []).map((shareholder, index) => (
              <div
                key={shareholder.id}
                className="border-l-4 border-blue-500 pl-4 py-2"
              >
                <h4 className="font-semibold text-sm mb-2">
                  Shareholder {index + 1}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-gray-600 text-xs">Name</Label>
                    <p className="font-medium">{shareholder.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Nationality</Label>
                    <p className="font-medium">{shareholder.nationality}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600 text-xs">Address</Label>
                    <p className="font-medium">
                      {shareholder.address}, {shareholder.city},{" "}
                      {shareholder.country}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Percentage (%)
                    </Label>
                    <p className="font-medium">
                      {shareholder.shareholderPercentage}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Shares</Label>
                    <p className="font-medium">
                      {Math.round(shareholder.shares)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Amount (£)</Label>
                    <p className="font-medium">
                      £{(shareholder.amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PSCs */}
      {formData.numberOfPSCs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Persons with Significant Control ({formData.numberOfPSCs})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(formData.pscList || []).map((psc, index) => (
                <div
                  key={psc.id}
                  className="border-l-4 border-green-500 pl-4 py-2"
                >
                  <h4 className="font-semibold text-sm mb-2">
                    PSC {index + 1}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-600 text-xs">Name</Label>
                      <p className="font-medium">{psc.shareholderName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">
                        Nationality
                      </Label>
                      <p className="font-medium">{psc.nationality}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-600 text-xs">Address</Label>
                      <p className="font-medium">
                        {psc.address}, {psc.city}, {psc.country}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-600 text-xs">
                        Level of Control
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {psc.levelOfControl?.map((level) => (
                          <Badge key={level} variant="secondary">
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name Change */}
          <div>
            <Label className="text-gray-600">Change Company Name?</Label>
            <p className="font-semibold mt-1">
              {formData.changeCompanyName ? "Yes" : "No"}
            </p>
            {formData.changeCompanyName && formData.suggestedNames && (
              <div className="mt-2 space-y-1">
                <Label className="text-gray-600 text-xs">
                  Suggested Names:
                </Label>
                <div className="space-y-1">
                  {formData.suggestedNames.map(
                    (name, index) =>
                      name && (
                        <p key={index} className="text-sm">
                          • {name}
                        </p>
                      ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activities Change */}
          <div>
            <Label className="text-gray-600">Change Company Activities?</Label>
            <p className="font-semibold mt-1">
              {formData.changeCompanyActivities ? "Yes" : "No"}
            </p>
            {formData.changeCompanyActivities && formData.companyActivities && (
              <div className="mt-2 space-y-1">
                <Label className="text-gray-600 text-xs">
                  Selected Activities:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {formData.companyActivities.map((code) => {
                    const activity = COMPANY_ACTIVITIES.find(
                      (a) => a.code === code,
                    );
                    return (
                      <Badge key={code} variant="secondary">
                        {activity?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {(formData.attachments || []).length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-semibold">
                {(formData.attachments || []).length} file(s) uploaded:
              </p>
              <ul className="space-y-1">
                {(formData.attachments || []).map((attachment) => (
                  <li key={attachment.id} className="text-sm flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    {attachment.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No documents uploaded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const steps = [
    { title: "Company Info", content: renderCompanyInfo },
    { title: "Shares Info", content: renderSharesInfo },
    { title: "Shareholders", content: renderShareholders },
    { title: "PSC", content: renderPSC },
    { title: "Updates", content: renderCompanyUpdates },
    { title: "Documents", content: renderDocuments },
    { title: "Review", content: renderReview },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-6">
        {/* Amendment Required Alert */}
        {formData.status === "amend-required" &&
          formData.comments &&
          formData.comments.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Amendments Required
                  </h3>
                  <p className="text-sm text-red-800 mb-3">
                    Please review the following comments from the admin and make
                    the necessary corrections before resubmitting:
                  </p>
                  <div className="space-y-2">
                    {formData.comments
                      .filter((c) => c.isAdminOnly)
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-white p-3 rounded border border-red-200"
                        >
                          <p className="text-sm font-medium text-gray-700">
                            {comment.author} ({new Date(comment.createdAt).toLocaleDateString()})
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Company Transfer Form</h2>
          <Progress
            value={(currentStep / steps.length) * 100}
            className="h-2"
          />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div key={index} className="text-center text-sm">
                <div
                  className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep - 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                  }`}
                >
                  {index < currentStep - 1 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p>{step.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">{steps[currentStep - 1]?.content()}</div>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNextStep}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Form Submitted Successfully
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Your transfer form has been submitted successfully. Form ID:{" "}
            {submittedForm?.formId}
          </p>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
