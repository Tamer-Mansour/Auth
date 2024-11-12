import {Component, OnInit, ViewChild} from '@angular/core';
import {MaterialModule} from '../../../material.module';
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {DomSanitizer} from "@angular/platform-browser";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";

declare var webkitSpeechRecognition: any;

interface TabData {
  'رقم الدعوى': { id: number; caseNumber: string; plaintiffName: string; nationalId: string }[];
  'اسم المدعي': { id: number; caseNumber: string; plaintiffName: string; nationalId: string }[];
  'رقم الهوية': { id: number; caseNumber: string; plaintiffName: string; nationalId: string }[];
  'تاريخ البدء': { id: number; startDate: string; caseName: string; status: string }[];
  'تاريخ الانتهاء': { id: number; endDate: string; caseName: string; status: string }[];
  'تاريخ التسجيل': { id: number; registrationDate: string; caseName: string; status: string }[];
  'اسم المدعى عليه': { id: number; defendantName: string; caseNumber: string; lawyerName: string }[];
  'اسم الشاهد': { id: number; witnessName: string; caseNumber: string; defendantName: string }[];
  'اسم المحامي': { id: number; lawyerName: string; caseNumber: string; clientName: string }[];
}

interface HeaderChild {
  name: keyof TabData;
  isSelected: boolean;
}

@Component({
  selector: 'app-sample-page',
  standalone: true,
  imports: [MaterialModule, NgForOf, FormsModule, NgIf, NgClass],
  templateUrl: './sample-page.component.html',
  styleUrls: ['./sample-page.component.scss'],
})

export class AppSamplePageComponent implements OnInit {
  constructor(private sanitizer: DomSanitizer) {}

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  paginatedData = new MatTableDataSource<any>();

  headers = [
    {
      name: ' بحث الكل',
      isSelected: true,
      children: [
        { name: 'رقم الدعوى', isSelected: false },
        { name: 'اسم المدعي', isSelected: false },
        { name: 'رقم الهوية', isSelected: false },
        { name: 'تاريخ البدء', isSelected: false },
        { name: 'تاريخ الانتهاء', isSelected: false },
        { name: 'تاريخ التسجيل', isSelected: false },
        { name: 'اسم المدعى عليه', isSelected: false },
        // { name: 'اسم الشاهد', isSelected: false },
        // { name: 'اسم المحامي', isSelected: false },
      ],
    },
    {
      name: 'بحث بالملفات', // Main header (translated as "File Search")
      isSelected: false,
      children: [
        { name: 'رقم الدعوى', isSelected: false },
        { name: 'اسم المدعي', isSelected: false },
        { name: 'رقم الهوية', isSelected: false },
      ],
    },
    {
      name: 'بحث بالتاريخ', // Additional header (translated as "Date Search")
      isSelected: false,
      children: [
        { name: 'تاريخ البدء', isSelected: false },
        { name: 'تاريخ الانتهاء', isSelected: false },
        { name: 'تاريخ التسجيل', isSelected: false },
      ],
    },
    {
      name: 'بحث بالأطراف', // Additional header (translated as "Party Search")
      isSelected: false,
      children: [
        { name: 'اسم المدعى عليه', isSelected: false },
        { name: 'اسم الشاهد', isSelected: false },
        { name: 'اسم المحامي', isSelected: false },
      ],
    }
  ];

  languages = [
    {code: 'en-US', label: 'English'},
    {code: 'ar-SA', label: 'Arabic'}
  ];
  selectedLanguage = 'ar-SA';
  isRtl = false;
  recognition: any;
  isRecording: boolean = false;
  spokenText: string = '';
  interimText: string = '';
  highlightedText: string = '';
  selectedHeader: any;
  selectedChild: HeaderChild | null = null;
  activeTabIndex: number = 0;

  tabData: TabData = {
    'رقم الدعوى': [
      { id: 28, caseNumber: '942', plaintiffName: 'أحمد', nationalId: '3136' },
      { id: 29, caseNumber: '110', plaintiffName: 'زياد', nationalId: '7435' },
      { id: 30, caseNumber: '836', plaintiffName: 'عمر', nationalId: '6818' },
      { id: 31, caseNumber: '680', plaintiffName: 'علي', nationalId: '5799' },
      { id: 32, caseNumber: '971', plaintiffName: 'باسم', nationalId: '8867' },
      { id: 33, caseNumber: '998', plaintiffName: 'محمد', nationalId: '6995' },
      { id: 34, caseNumber: '954', plaintiffName: 'محمد', nationalId: '7301' },
      { id: 35, caseNumber: '940', plaintiffName: 'سامي', nationalId: '1846' },
      { id: 36, caseNumber: '526', plaintiffName: 'خالد', nationalId: '2494' },
      { id: 37, caseNumber: '733', plaintiffName: 'علي', nationalId: '1529' },
    ],
    'اسم المدعي': [
      { id: 38, caseNumber: '818', plaintiffName: 'علي', nationalId: '7353' },
      { id: 39, caseNumber: '108', plaintiffName: 'طارق', nationalId: '3093' },
      { id: 40, caseNumber: '347', plaintiffName: 'محمد', nationalId: '5453' },
      { id: 41, caseNumber: '705', plaintiffName: 'يوسف', nationalId: '2174' },
      { id: 42, caseNumber: '209', plaintiffName: 'عمر', nationalId: '3857' },
      { id: 43, caseNumber: '485', plaintiffName: 'محمد', nationalId: '6600' },
      { id: 44, caseNumber: '973', plaintiffName: 'علي', nationalId: '8415' },
      { id: 45, caseNumber: '609', plaintiffName: 'باسم', nationalId: '8409' },
      { id: 46, caseNumber: '561', plaintiffName: 'عمر', nationalId: '5736' },
      { id: 47, caseNumber: '795', plaintiffName: 'أحمد', nationalId: '4048' }
    ],
    'رقم الهوية': [
      { id: 48, caseNumber: '653', plaintiffName: 'حسن', nationalId: '1438' },
      { id: 49, caseNumber: '766', plaintiffName: 'زياد', nationalId: '4940' },
      { id: 50, caseNumber: '574', plaintiffName: 'أحمد', nationalId: '6355' },
      { id: 51, caseNumber: '145', plaintiffName: 'سامي', nationalId: '4740' },
      { id: 52, caseNumber: '397', plaintiffName: 'علي', nationalId: '9774' },
      { id: 53, caseNumber: '882', plaintiffName: 'حسن', nationalId: '3064' },
      { id: 54, caseNumber: '802', plaintiffName: 'علي', nationalId: '9616' },
      { id: 55, caseNumber: '591', plaintiffName: 'باسم', nationalId: '9948' },
      { id: 56, caseNumber: '656', plaintiffName: 'خالد', nationalId: '7411' },
      { id: 57, caseNumber: '788', plaintiffName: 'خالد', nationalId: '1112' }
    ],
    'تاريخ البدء': [
      { id: 58, startDate: '2023-03-22', caseName: 'قضية 8', status: 'معلق' },
      { id: 59, startDate: '2023-01-07', caseName: 'قضية 5', status: 'معلق' },
      { id: 60, startDate: '2023-01-20', caseName: 'قضية 1', status: 'مفتوح' },
      { id: 61, startDate: '2023-03-29', caseName: 'قضية 6', status: 'معلق' },
      { id: 62, startDate: '2023-03-01', caseName: 'قضية 5', status: 'مفتوح' },
      { id: 63, startDate: '2023-01-13', caseName: 'قضية 1', status: 'مفتوح' },
      { id: 64, startDate: '2023-01-13', caseName: 'قضية 7', status: 'مغلق' },
      { id: 65, startDate: '2023-02-11', caseName: 'قضية 3', status: 'مفتوح' },
      { id: 66, startDate: '2023-04-07', caseName: 'قضية 5', status: 'مغلق' },
      { id: 67, startDate: '2023-03-24', caseName: 'قضية 6', status: 'مغلق' }
    ],
    'تاريخ الانتهاء': [
      { id: 68, endDate: '2023-03-13', caseName: 'قضية 4', status: 'معلق' },
      { id: 69, endDate: '2023-04-04', caseName: 'قضية 8', status: 'مفتوح' },
      { id: 70, endDate: '2023-01-06', caseName: 'قضية 8', status: 'معلق' },
      { id: 71, endDate: '2023-03-13', caseName: 'قضية 7', status: 'معلق' },
      { id: 72, endDate: '2023-03-17', caseName: 'قضية 4', status: 'مفتوح' },
      { id: 73, endDate: '2023-01-15', caseName: 'قضية 1', status: 'معلق' },
      { id: 74, endDate: '2023-01-28', caseName: 'قضية 6', status: 'معلق' },
      { id: 75, endDate: '2023-02-15', caseName: 'قضية 1', status: 'مغلق' },
      { id: 76, endDate: '2023-03-13', caseName: 'قضية 5', status: 'مفتوح' },
      { id: 77, endDate: '2023-01-04', caseName: 'قضية 5', status: 'معلق' }
    ],
    'تاريخ التسجيل': [
      { id: 78, registrationDate: '2023-03-24', caseName: 'قضية 8', status: 'معلق' },
      { id: 79, registrationDate: '2023-01-24', caseName: 'قضية 9', status: 'معلق' },
      { id: 80, registrationDate: '2023-03-23', caseName: 'قضية 2', status: 'مغلق' },
      { id: 81, registrationDate: '2023-03-19', caseName: 'قضية 4', status: 'معلق' },
      { id: 82, registrationDate: '2023-03-19', caseName: 'قضية 4', status: 'مغلق' },
      { id: 83, registrationDate: '2023-01-10', caseName: 'قضية 10', status: 'معلق' },
      { id: 84, registrationDate: '2023-01-17', caseName: 'قضية 8', status: 'مفتوح' },
      { id: 85, registrationDate: '2023-02-10', caseName: 'قضية 6', status: 'مغلق' },
      { id: 86, registrationDate: '2023-03-12', caseName: 'قضية 7', status: 'معلق' },
      { id: 87, registrationDate: '2023-02-15', caseName: 'قضية 9', status: 'مغلق' }
    ],
    'اسم المدعى عليه': [
      { id: 88, defendantName: 'عمرو', caseNumber: '729', lawyerName: 'باسم' },
      { id: 89, defendantName: 'مروان', caseNumber: '654', lawyerName: 'محمود' },
      { id: 90, defendantName: 'علي', caseNumber: '740', lawyerName: 'سعيد' },
      { id: 91, defendantName: 'عادل', caseNumber: '974', lawyerName: 'عادل' },
      { id: 92, defendantName: 'علي', caseNumber: '270', lawyerName: 'أحمد' },
      { id: 93, defendantName: 'مروان', caseNumber: '565', lawyerName: 'فادي' },
      { id: 94, defendantName: 'خالد', caseNumber: '229', lawyerName: 'باسم' },
      { id: 95, defendantName: 'علي', caseNumber: '584', lawyerName: 'محمود' },
      { id: 96, defendantName: 'مازن', caseNumber: '546', lawyerName: 'عادل' },
      { id: 97, defendantName: 'عمر', caseNumber: '991', lawyerName: 'أحمد' }
    ],
    'اسم الشاهد': [
      { id: 98, witnessName: 'طارق', caseNumber: '652', defendantName: 'زيد' },
      { id: 99, witnessName: 'خالد', caseNumber: '424', defendantName: 'فادي' },
      { id: 100, witnessName: 'باسم', caseNumber: '334', defendantName: 'فيصل' },
      { id: 101, witnessName: 'طارق', caseNumber: '705', defendantName: 'سامي' },
      { id: 102, witnessName: 'حسن', caseNumber: '384', defendantName: 'مروان' },
      { id: 103, witnessName: 'علي', caseNumber: '226', defendantName: 'فادي' },
      { id: 104, witnessName: 'علي', caseNumber: '131', defendantName: 'فيصل' },
      { id: 105, witnessName: 'زياد', caseNumber: '969', defendantName: 'مروان' },
      { id: 106, witnessName: 'خالد', caseNumber: '768', defendantName: 'عمر' },
      { id: 107, witnessName: 'علي', caseNumber: '203', defendantName: 'فادي' }
    ],
    'اسم المحامي': [
      { id: 108, lawyerName: 'باسم', caseNumber: '736', clientName: 'محمد' },
      { id: 109, lawyerName: 'علي', caseNumber: '736', clientName: 'طارق' },
      { id: 110, lawyerName: 'عمرو', caseNumber: '638', clientName: 'عمر' },
      { id: 111, lawyerName: 'باسم', caseNumber: '785', clientName: 'باسم' },
      { id: 112, lawyerName: 'زيد', caseNumber: '700', clientName: 'طارق' },
      { id: 113, lawyerName: 'علي', caseNumber: '301', clientName: 'خالد' },
      { id: 114, lawyerName: 'أحمد', caseNumber: '533', clientName: 'زياد' },
      { id: 115, lawyerName: 'مروان', caseNumber: '665', clientName: 'علي' },
      { id: 116, lawyerName: 'حسن', caseNumber: '180', clientName: 'باسم' },
      { id: 117, lawyerName: 'عمرو', caseNumber: '829', clientName: 'عمر' }
    ]
  };

  filteredData: any[] = [];

  ngOnInit(): void {
    this.setupSpeechRecognition();
    this.selectedHeader = this.headers[0];
    this.selectedChild = this.selectedHeader.children[0];
    this.activeTabIndex = 0;
    this.updateFilteredData();
    // this.startRecognition();
    this.paginatedData.data = this.filteredData;
  }

  setupSpeechRecognition() {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.continuous = true; // Keep listening until manually stopped
    this.recognition.interimResults = true; // Enable interim results for live feedback
    this.recognition.lang = this.selectedLanguage;

    this.recognition.onresult = (event: any) => this.processSpeech(event);
    this.recognition.onerror = (event: any) => console.error(event);

    // Automatically restart recognition when it ends
    this.recognition.onend = () => {
      if (this.isRecording) {
        this.recognition.start(); // Restart recognition if still recording
      }
    };
  }

  updateDirection() {
    this.isRtl = this.selectedLanguage === 'ar-SA';
  }

  toggleRecording() {
    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    } else {
      this.startRecognition();
    }
  }

  startRecognition() {
    this.recognition.lang = this.selectedLanguage; // Set language before starting
    this.recognition.start();
    this.isRecording = true;
  }

  processSpeech(event: any) {
    let finalTranscript = ''; // Temporary variable to store final results

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];

      if (result.isFinal) {
        // Append the final recognized text immediately to spokenText and clear interimText
        finalTranscript += result[0].transcript + ' ';
        this.spokenText = finalTranscript;
        this.interimText = ''; // Clear interim text after final result
        this.selectHeaderOrChild(result[0].transcript.toLowerCase());
      } else {
        // Update the input field with interim results without adding to spokenText
        this.interimText = this.spokenText + result[0].transcript; // Live updating of interim text
      }
    }
  }

  onLanguageChange(value: any) {
    if (this.isRecording) {
      this.recognition.stop();
      this.startRecognition(); // Restart with the new language
    }
  }

  processSearchQuery(query: string) {
    query = query.toLowerCase().trim();

    let headerMatched = false;
    let childMatched = false;

    // Step 1: Full header-child match
    for (const header of this.headers) {
      for (let i = 0; i < header.children.length; i++) {
        const child = header.children[i] as HeaderChild;
        const combinedName = `${header.name} ${child.name}`.toLowerCase();

        if (query.startsWith(combinedName)) {
          this.setSelectedHeaderChild(header, child, i);
          headerMatched = childMatched = true;
          query = query.replace(combinedName, '').trim();
          break;
        }
      }
      if (headerMatched && childMatched) break;
    }

    // Step 2: Header-only match
    if (!headerMatched) {
      for (const header of this.headers) {
        if (query.startsWith(header.name.toLowerCase())) {
          this.selectedHeader = header;
          this.setSelectedChild(header.children[0] as HeaderChild);
          headerMatched = true;
          query = query.replace(header.name.toLowerCase(), '').trim();
          break;
        }
      }
    }

    // Step 3: Child-only match within selected header
    if (headerMatched && this.selectedHeader && !childMatched) {
      for (let i = 0; i < this.selectedHeader.children.length; i++) {
        const child = this.selectedHeader.children[i];
        if (query.startsWith(child.name.toLowerCase())) {
          this.setSelectedHeaderChild(this.selectedHeader, child, i);
          childMatched = true;
          query = query.replace(child.name.toLowerCase(), '').trim();
          break;
        }
      }
    }

    // Step 4: Global child match if no header matched
    if (!headerMatched && !childMatched) {
      for (const header of this.headers) {
        for (let i = 0; i < header.children.length; i++) {
          const child = header.children[i] as HeaderChild;
          if (query.startsWith(child.name.toLowerCase())) {
            this.setSelectedHeaderChild(header, child, i);
            childMatched = true;
            query = query.replace(child.name.toLowerCase(), '').trim();
            break;
          }
        }
        if (childMatched) break;
      }
    }

    // Step 5: Default to first child if only header matched
    if (headerMatched && !childMatched && this.selectedHeader) {
      this.setSelectedChild(this.selectedHeader.children[0]);
    }

    // Step 6: Filter data based on remaining query text
    this.filteredData = this.filterDataBasedOnQuery(query);
    // console.log("Search Query:", query);
    // console.log("Selected Header:", this.selectedHeader ? this.selectedHeader.name : "None");
    // console.log("Selected Child:", this.selectedChild ? this.selectedChild.name : "None");
    // console.log("Filtered Data:", this.filteredData);
  }

  setSelectedHeaderChild(header: any, child: HeaderChild, tabIndex: number) {
    this.selectedHeader = header;
    this.setSelectedChild(child as HeaderChild);
    this.activeTabIndex = tabIndex;
    this.updateFilteredData();
  }

  setSelectedChild(child: HeaderChild) {
    this.selectedChild = child;
    this.updateChildSelection(this.selectedHeader, child);
  }

  filterDataBasedOnQuery(query: string): any[] {
    if (this.selectedChild && query.length > 0) {
      return this.tabData[this.selectedChild.name].filter((item: any) =>
        Object.values(item).some((value) =>
          value && value.toString().toLowerCase().includes(query)
        )
      );
    }
    return this.selectedChild ? this.tabData[this.selectedChild.name] : [];
  }

  selectHeaderOrChild(transcript: string) {
    this.processSearchQuery(transcript);
  }

  getDisplayedColumns(): string[] {
    if (this.filteredData.length > 0) {
      return Object.keys(this.filteredData[0]);
    }
    return [];
  }

  updateChildSelection(header: any, selectedChild: HeaderChild) {
    header.children.forEach((child: HeaderChild) => {
      child.isSelected = (child === selectedChild);  // Set true only for the selected child
    });
  }

  updateHighlightedText(query: string) {
    const headerName = this.selectedHeader ? this.selectedHeader.name : '';
    const childName = this.selectedChild ? this.selectedChild.name : '';

    let highlightedQuery = query;
    if (headerName && query.includes(headerName)) {
      highlightedQuery = highlightedQuery.replace(new RegExp(headerName, 'gi'), `<span class="highlight">${headerName}</span>`);
    }
    if (childName && query.includes(childName)) {
      highlightedQuery = highlightedQuery.replace(new RegExp(childName, 'gi'), `<span class="highlight">${childName}</span>`);
    }

    this.highlightedText = this.sanitizer.bypassSecurityTrustHtml(highlightedQuery) as string; // Bypass Angular's sanitizer
  }

  onSearch(event: any) {
    const query = event.target.value;
    this.processSearchQuery(query);
    this.paginatedData.data = this.filteredData;
    this.updateHighlightedText(query);
  }

  onHeaderSelected(header: any) {
    this.selectedHeader = header;
    this.selectedChild = header.children[0];
    this.updateFilteredData();
  }

  onTabChange(index: number) {
    if (this.selectedHeader && this.selectedHeader.children) {
      this.selectedChild = this.selectedHeader.children[index];
      this.updateFilteredData();
    }
  }

  updateFilteredData() {
    if (this.selectedChild) {
      this.filteredData = this.tabData[this.selectedChild.name] || [];
      this.paginatedData.data = this.filteredData;
      this.paginatedData.paginator = this.paginator; // Link paginator with data source
    }
  }
}
