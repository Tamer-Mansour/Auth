import {Component, OnInit} from '@angular/core';
import {MaterialModule} from '../../../material.module';
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {log} from "@angular-devkit/build-angular/src/builders/ssr-dev-server";
import {DomSanitizer} from "@angular/platform-browser";

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
      { id: 1, caseNumber: '123', plaintiffName: 'أحمد', nationalId: '1001' },
      { id: 2, caseNumber: '456', plaintiffName: 'محمد', nationalId: '1002' },
      { id: 3, caseNumber: '789', plaintiffName: 'خالد', nationalId: '1003' },
    ],
    'اسم المدعي': [
      { id: 4, caseNumber: '321', plaintiffName: 'سامي', nationalId: '2001' },
      { id: 5, caseNumber: '654', plaintiffName: 'علي', nationalId: '2002' },
      { id: 6, caseNumber: '987', plaintiffName: 'عمر', nationalId: '2003' },
    ],
    'رقم الهوية': [
      { id: 7, caseNumber: '213', plaintiffName: 'يوسف', nationalId: '3001' },
      { id: 8, caseNumber: '546', plaintiffName: 'زياد', nationalId: '3002' },
      { id: 9, caseNumber: '879', plaintiffName: 'حسن', nationalId: '3003' },
    ],
    'تاريخ البدء': [
      { id: 10, startDate: '2023-01-01', caseName: 'قضية 1', status: 'مفتوح' },
      { id: 11, startDate: '2023-02-01', caseName: 'قضية 2', status: 'مغلق' },
      { id: 12, startDate: '2023-03-01', caseName: 'قضية 3', status: 'معلق' },
    ],
    'تاريخ الانتهاء': [
      { id: 13, endDate: '2023-01-10', caseName: 'قضية 4', status: 'مغلق' },
      { id: 14, endDate: '2023-02-10', caseName: 'قضية 5', status: 'معلق' },
      { id: 15, endDate: '2023-03-10', caseName: 'قضية 6', status: 'مفتوح' },
    ],
    'تاريخ التسجيل': [
      { id: 16, registrationDate: '2022-12-01', caseName: 'قضية 7', status: 'مفتوح' },
      { id: 17, registrationDate: '2023-01-15', caseName: 'قضية 8', status: 'مغلق' },
      { id: 18, registrationDate: '2023-02-20', caseName: 'قضية 9', status: 'معلق' },
    ],
    'اسم المدعى عليه': [
      { id: 19, defendantName: 'خالد', caseNumber: '147', lawyerName: 'عمرو' },
      { id: 20, defendantName: 'مازن', caseNumber: '258', lawyerName: 'زيد' },
      { id: 21, defendantName: 'فيصل', caseNumber: '369', lawyerName: 'حسن' },
    ],
    'اسم الشاهد': [
      { id: 22, witnessName: 'ياسر', caseNumber: '123', defendantName: 'سامي' },
      { id: 23, witnessName: 'طارق', caseNumber: '456', defendantName: 'علي' },
      { id: 24, witnessName: 'باسم', caseNumber: '789', defendantName: 'عمر' },
    ],
    'اسم المحامي': [
      { id: 25, lawyerName: 'أحمد', caseNumber: '741', clientName: 'فادي' },
      { id: 26, lawyerName: 'علي', caseNumber: '852', clientName: 'عادل' },
      { id: 27, lawyerName: 'سعيد', caseNumber: '963', clientName: 'مروان' },
    ]
  };

  filteredData: any[] = [];

  ngOnInit(): void {
    this.setupSpeechRecognition();
    this.selectedHeader = this.headers[0];
    this.selectedChild = this.selectedHeader.children[0];
    this.activeTabIndex = 0;
    this.updateFilteredData();
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
    console.log("Search Query:", query);
    console.log("Selected Header:", this.selectedHeader ? this.selectedHeader.name : "None");
    console.log("Selected Child:", this.selectedChild ? this.selectedChild.name : "None");
    console.log("Filtered Data:", this.filteredData);
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

  constructor(private sanitizer: DomSanitizer) {}

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
    this.updateHighlightedText(query);
  }


  onHeaderSelected(header: any) {
    this.selectedHeader = header;
    this.selectedChild = header.children[0];
    this.updateFilteredData();
  }

  onTabChange(index: number) {
    if (this.selectedHeader && this.selectedHeader.children) {
      const selectedChild = this.selectedHeader.children[index];
      this.selectedChild = selectedChild;
      this.updateFilteredData();
    }
  }

  updateFilteredData() {
    // Reset the filtered data to the full dataset of the selected child tab
    if (this.selectedChild) {
      this.filteredData = this.tabData[this.selectedChild.name] || [];
    }
  }
}
