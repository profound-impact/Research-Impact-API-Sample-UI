import {
  Component,
  NgZone,
  ChangeDetectorRef,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpService } from './services/http.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// Define an interface for the upload URL response
interface UploadUrlResponse {
  fileId: string;
  url: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  providers: [HttpService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'my-angular19-app';
  menuItems = [
    {
      title: 'Endpoints',
      items: [
        {
          title: 'Grants endpoints',
          subitems: [
            'Search grants',
            'Get a single grant',
            'Add grant by parameters',
            'Add grant by PDF',
          ],
        },
        {
          title: 'Researchers endpoints',
          subitems: [
            'Search researchers',
            'Get a single researcher',
            'Add researcher by parameters',
            'Add researcher by PDF',
          ],
        },
        // {
        //   title: 'Matches endpoints',
        //   subitems: ['Get matches'],
        // },
      ],
      open: true,
    },
  ];

  // Create a form group using FormBuilder
  searchForm: FormGroup;

  // Add grant form
  addGrantForm!: FormGroup;

  // Results signal
  grants = signal<any[]>([]);

  // Loading state
  isLoading = signal(false);

  // Computed signal for form validity
  formIsValid = computed(() => {
    return this.searchForm && this.searchForm.valid;
  });

  // Add this with your other signals
  singleGrant = signal<any>(null);
  singleGrantLoading = signal<boolean>(false);
  singleGrantError = signal<string | null>(null);

  // Add grant signals
  addGrantLoading = signal(false);
  addGrantSuccess = signal<any>(null);
  addGrantError = signal<string | null>(null);

  // Add available career stages array
  availableCareerStages = [
    'Early Career Researcher',
    'Mid Career Researcher',
    'Experienced Researcher',
  ];

  // Add this to your existing signals
  uploadUrlResponse = signal<UploadUrlResponse | null>(null);
  uploadUrlError = signal<string | null>(null);
  uploadUrlLoading = signal(false);

  // FIXING THE MISMATCH: Map the HTML control names directly
  // These are the exact names used in the HTML template
  private readonly pdfFormArrays = {
    applicationDeadlines: 'applicationDeadlines',
    eligibility_criteria_countries: 'eligibility_criteria_countries',
    eligibility_criteria_provinces: 'eligibility_criteria_provinces',
    eligibility_criteria_careerStages: 'eligibility_criteria_careerStages',
    eligibility_criteria_general: 'eligibility_criteria_general',
  } as const;

  addGrantPdfForm!: FormGroup;
  addGrantPdfLoading = signal(false);
  addGrantPdfSuccess = signal<any>(null);
  addGrantPdfError = signal<string | null>(null);

  // Add a computed signal for PDF form validity
  pdfFormIsValid = computed(() => {
    return this.addGrantPdfForm && this.addGrantPdfForm.valid;
  });

  // Add these properties to your component class
  researcherSearchForm: FormGroup;
  researchers = signal<any[]>([]);
  researcherLoading = signal<boolean>(false);
  researcherError = signal<string | null>(null);

  constructor(
    public httpService: HttpService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    // Initialize the form in constructor
    this.searchForm = this.fb.group({
      titles: [''],
      sources: [''],
      deadlineRangeStart: [''],
      deadlineRangeEnd: [''],
      keywords: [''],
      areaOfResearches: [''],
      disciplines: [''],
      countries: [''],
    });

    // Initialize the add grant form
    this.initAddGrantForm();
    this.initAddGrantPdfForm();

    // Initialize researcher search form
    this.researcherSearchForm = this.fb.group({
      names: [''],
      faculties: [''],
      keywords: [''],
      areaOfResearches: [''],
      disciplines: [''],
    });
  }

  ngOnInit() {
    // Call in ngOnInit instead of constructor
    // this.getSingleGrant(79084);
    this.initializeFormWithDefaults();
    // this.searchForGrants();
    // Add this subscription to watch deadlineType changes
    this.addGrantForm.get('deadlineType')?.valueChanges.subscribe((value) => {
      if (value === 'Continuous') {
        const deadlinesArray = this.addGrantForm.get(
          'applicationDeadlines'
        ) as FormArray;
        while (deadlinesArray.length) {
          deadlinesArray.removeAt(0);
        }
      }
    });
    // Add this new subscription for addGrantPdfForm
    this.addGrantPdfForm
      .get('deadlineType')
      ?.valueChanges.subscribe((value) => {
        if (value === 'Continuous') {
          const deadlinesArray = this.getFormArrayByKey('deadlines');
          while (deadlinesArray.length) {
            deadlinesArray.removeAt(0);
          }
        }
      });

    // Add similar subscription for PDF form
    this.addGrantPdfForm
      .get('deadlineType')
      ?.valueChanges.subscribe((value) => {
        if (value === 'Continuous') {
          const deadlinesArray = this.addGrantPdfForm.get(
            'applicationDeadlines'
          ) as FormArray;
          while (deadlinesArray.length) {
            deadlinesArray.removeAt(0);
          }
        }
      });
  }

  // Initialize form with default values for testing
  initializeFormWithDefaults() {
    this.searchForm.setValue({
      titles: '',
      sources: '',
      deadlineRangeStart: '',
      deadlineRangeEnd: '',
      keywords: '',
      areaOfResearches: '',
      disciplines: '',
      countries: 'Canada',
    });
  }

  // Method to initialize the add grant form with default values
  initAddGrantForm() {
    this.addGrantForm = this.fb.group({
      public: [false],
      title: ['', Validators.required],
      source: ['', Validators.required],
      websiteLink: [''],
      summary: ['', Validators.required],
      pdfFileName: [''],
      applicationDeadlines: this.fb.array([
        this.fb.group({
          applicationDeadline: [''],
          registrationOfIntentDeadline: [''],
        }),
      ]),
      deadlineType: ['Regular'],
      budget: [0, [Validators.min(0)]],
      awardAmount: [0, [Validators.min(0)]],
      currencyCode: ['CAD'],
      budgetDescription: [''],
      keywords: this.fb.array([this.fb.control('')]),
      eligibility_criteria_countries: this.fb.array([this.fb.control('')]),
      eligibility_criteria_provinces: this.fb.array([this.fb.control('')]),
      eligibility_criteria_careerStages: this.fb.array([this.fb.control('')]),
      eligibility_criteria_general: this.fb.array([this.fb.control('')]),
    });
  }

  // Helper method to create a deadline form group
  createDeadlineFormGroup(): FormGroup {
    return this.fb.group({
      applicationDeadline: [''],
      registrationOfIntentDeadline: [''],
    });
  }

  // Helper methods to manage form arrays
  get applicationDeadlinesArray(): FormArray {
    return this.addGrantForm.get('applicationDeadlines') as FormArray;
  }

  get keywordsArray(): FormArray {
    return this.addGrantForm.get('keywords') as FormArray;
  }

  get countriesArray(): FormArray {
    return this.addGrantForm.get('eligibility_criteria_countries') as FormArray;
  }

  get provincesArray(): FormArray {
    return this.addGrantForm.get('eligibility_criteria_provinces') as FormArray;
  }

  get careerStagesArray(): FormArray {
    return this.addGrantForm.get(
      'eligibility_criteria_careerStages'
    ) as FormArray;
  }

  get generalEligibilityArray(): FormArray {
    return this.addGrantForm.get('eligibility_criteria_general') as FormArray;
  }

  // Methods to add/remove items from arrays
  addDeadline() {
    this.applicationDeadlinesArray.push(this.createDeadlineFormGroup());
  }

  removeDeadline(index: number) {
    if (this.applicationDeadlinesArray.length > 1) {
      this.applicationDeadlinesArray.removeAt(index);
    }
  }

  addItemToArray(arrayName: string) {
    const array = this.addGrantForm.get(arrayName) as FormArray;
    array.push(this.fb.control(''));
  }

  removeItemFromArray(arrayName: string, index: number) {
    const array = this.addGrantForm.get(arrayName) as FormArray;
    if (array.length > 1) {
      array.removeAt(index);
    }
  }

  // Method to prepare form data by removing empty array items
  prepareFormData(isPdfForm = false) {
    const formData = isPdfForm
      ? { ...this.addGrantPdfForm.value }
      : { ...this.addGrantForm.value };

    if (isPdfForm) {
      // Handle PDF form arrays
      Object.keys(this.pdfFormArrays).forEach((key) => {
        const arrayKey = key as keyof typeof this.pdfFormArrays;
        if (formData[arrayKey]) {
          formData[arrayKey] = formData[arrayKey].filter((item: any) => {
            if (typeof item === 'string') {
              return item.trim() !== '';
            } else if (typeof item === 'object' && item !== null) {
              // For applicationDeadlines which is an array of objects
              return Object.values(item).some(
                (val) => val && String(val).trim() !== ''
              );
            }
            return false;
          });
        }
      });
    } else {
      // Handle regular form arrays
      formData.keywords = formData.keywords.filter(
        (keyword: string) => keyword.trim() !== ''
      );
      formData.eligibility_criteria_countries =
        formData.eligibility_criteria_countries.filter(
          (country: string) => country.trim() !== ''
        );
      formData.eligibility_criteria_provinces =
        formData.eligibility_criteria_provinces.filter(
          (province: string) => province.trim() !== ''
        );
      formData.eligibility_criteria_careerStages =
        formData.eligibility_criteria_careerStages.filter(
          (stage: string) => stage.trim() !== ''
        );
      formData.eligibility_criteria_general =
        formData.eligibility_criteria_general.filter(
          (item: string) => item.trim() !== ''
        );
    }

    return formData;
  }

  anchorSection(item: any) {
    const sectionId =
      item.sectionId ||
      item.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Updated search method to use form values
  searchForGrants() {
    // Set loading state
    this.isLoading.set(true);

    // Get form values and format them appropriately for the API
    const formValues = this.searchForm.value;

    // Define search parameters from form values
    // Convert comma-separated strings to arrays where needed
    const searchParams = {
      sources: formValues.sources
        ? formValues.sources
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      titles: formValues.titles
        ? formValues.titles
            .split(';')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      deadlineRangeStart: formValues.deadlineRangeStart,
      deadlineRangeEnd: formValues.deadlineRangeEnd,
      keywords: formValues.keywords
        ? formValues.keywords
            .split(';')
            .map((k: string) => k.trim())
            .filter(Boolean)
        : [],
      areaOfResearches: formValues.areaOfResearches
        ? formValues.areaOfResearches
            .split(';')
            .map((a: string) => a.trim())
            .filter(Boolean)
        : [],
      disciplines: formValues.disciplines
        ? formValues.disciplines
            .split(';')
            .map((d: string) => d.trim())
            .filter(Boolean)
        : [],
      countries: formValues.countries
        ? formValues.countries
            .split(';')
            .map((c: string) => c.trim())
            .filter(Boolean)
        : [],
    };

    this.httpService.searchGrants(searchParams).subscribe({
      next: (result) => {
        this.zone.run(() => {
          // Update the grants signal with the new data
          this.grants.set(result);

          // Update loading state
          this.isLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error searching grants:', error);

          // Set fallback data in case of error
          this.grants.set([
            {
              id: 9999,
              title: 'Fallback Grant (API Error)',
              source: 'Error Fallback Source',
              status: 'Error',
              budget: 'CAD $0',
              deadlineType: 'Regular',
              deadlineIntake: 'Single',
              deadlineStage: 'Single',
            },
          ]);

          // Update loading state
          this.isLoading.set(false);
        });
      },
    });
  }

  /**
   * Get detailed information about a single grant by ID
   * @param id The unique identifier of the grant
   */
  getSingleGrant(id: number | string) {
    // Reset state
    this.singleGrantLoading.set(true);
    this.singleGrantError.set(null);

    // Log the action
    console.log(`Fetching details for grant with ID: ${id}`);

    // Use the get method from HttpService
    this.httpService.get(`grant/${id}`).subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          console.log('Single grant API result:', result);

          // Update the singleGrant signal with the new data
          // Update the singleGrant signal with the new data
          this.singleGrant.set(result);

          // Update loading state
          this.singleGrantLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error(`Error fetching grant with ID ${id}:`, error);

          // Set error message
          this.singleGrantError.set(
            error.status === 404
              ? `Grant with ID ${id} not found`
              : `Error loading grant: ${error.message || 'Unknown error'}`
          );

          // Reset data and update loading state
          this.singleGrant.set(null);
          this.singleGrantLoading.set(false);
        });
      },
    });
  }

  /**
   * Adds a new grant to the system by providing structured parameters
   * This triggers the AI stack and Area of Research(AOR) attachment
   * Note: AI processing takes approximately 10 minutes to complete
   */
  addGrantByParameters() {
    // Check if form is valid
    if (this.addGrantForm.invalid) {
      console.error('Form is invalid:', this.addGrantForm.errors);
      this.addGrantError.set('Please fill in all required fields correctly');
      return;
    }

    // Reset state
    this.addGrantLoading.set(true);
    this.addGrantSuccess.set(null);
    this.addGrantError.set(null);

    // Get form values and prepare payload
    const payload = this.prepareFormData(false);

    // Log the action
    console.log('Adding new grant with payload:', payload);

    // Use the HttpService to make the POST request
    this.httpService.post('grant', payload).subscribe({
      next: (result) => {
        this.zone.run(() => {
          console.log('Grant added successfully:', result);

          // Update success signal with the result data
          this.addGrantSuccess.set(result);

          // Reset form
          this.initAddGrantForm();

          // Update loading state
          this.addGrantLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error adding grant:', error);

          // Set error message
          this.addGrantError.set(
            `Failed to add grant: ${error.error?.message || 'Unknown error'}`
          );

          // Update loading state
          this.addGrantLoading.set(false);
        });
      },
    });
  }

  // Reset form method
  resetForm() {
    // First, clear the results
    // this.grants.set([]);

    // Use setTimeout to ensure this runs after current change detection cycle
    setTimeout(() => {
      this.zone.run(() => {
        // Reset with empty values
        this.searchForm.reset({
          titles: '',
          sources: '',
          deadlineRangeStart: '',
          deadlineRangeEnd: '',
          keywords: '',
          areaOfResearches: '',
          disciplines: '',
          countries: '',
        });

        // Force change detection
        this.cdr.detectChanges();
      });
    }, 0);
  }

  resetAddGrantForm(): void {
    // Clear values
    this.addGrantForm.reset();

    // Reset success/error states
    this.addGrantSuccess.set(null);
    this.addGrantError.set(null);

    // Reset form arrays to initial state with just one empty entry each
    this.resetFormArray('applicationDeadlines', this.createDeadlineFormGroup());
    this.resetFormArray('keywords');
    this.resetFormArray('eligibility_criteria_countries');
    this.resetFormArray('eligibility_criteria_provinces');
    this.resetFormArray('eligibility_criteria_careerStages');
    this.resetFormArray('eligibility_criteria_general');
  }

  resetFormArray(formArrayName: string, initialGroup?: FormGroup): void {
    const formArray = this.addGrantForm.get(formArrayName) as FormArray;

    // Clear existing items
    while (formArray.length > 0) {
      formArray.removeAt(0);
    }

    // Add one empty item
    if (initialGroup) {
      formArray.push(initialGroup);
    } else {
      formArray.push(this.fb.control(''));
    }
  }

  // Method to get unused career stages
  getUnusedCareerStages(currentIndex: number): string[] {
    const usedStages = this.careerStagesArray.value;
    return this.availableCareerStages.filter(
      (stage) =>
        !usedStages.includes(stage) ||
        usedStages.indexOf(stage) === currentIndex
    );
  }

  // Method to get upload URL for PDF grant
  getGrantPdfUploadUrl() {
    // Set loading state
    this.uploadUrlLoading.set(true);
    this.uploadUrlError.set(null);

    // Use the existing HttpService
    this.httpService.get('uploadURL/grant/pdf').subscribe({
      next: (response: any) => {
        this.zone.run(() => {
          console.log('Upload URL response:', response);
          this.uploadUrlResponse.set(response as UploadUrlResponse);
          this.uploadUrlLoading.set(false);

          // Automatically call the method to set PDF filename
          this.setPdfFileNameWhenReceived();
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error getting upload URL:', error);
          this.uploadUrlError.set(error.message || 'Failed to get upload URL');
          this.uploadUrlLoading.set(false);
        });
      },
    });
  }

  // Add the missing method
  setPdfFileNameWhenReceived(): void {
    const response = this.uploadUrlResponse();
    if (response && response.fileId) {
      console.log('Setting PDF filename to:', response.fileId);
      this.addGrantPdfForm.patchValue({
        pdfFileName: response.fileId,
      });
      // Force update validity
      this.addGrantPdfForm.get('pdfFileName')?.updateValueAndValidity();
      this.addGrantPdfForm.updateValueAndValidity();
      console.log(
        'Form valid after setting filename:',
        this.addGrantPdfForm.valid
      );

      // Force change detection
      this.cdr.detectChanges();
    } else {
      console.log('No response or fileId to set');
    }
  }

  // Method to validate the form manually
  manuallyValidateForm(): void {
    // Force validation update
    this.addGrantPdfForm.get('title')?.updateValueAndValidity();
    this.addGrantPdfForm.get('source')?.updateValueAndValidity();
    this.addGrantPdfForm.get('pdfFileName')?.updateValueAndValidity();

    // Force validation on the whole form
    this.addGrantPdfForm.updateValueAndValidity();

    // Force change detection
    this.cdr.detectChanges();

    console.log(
      'Form valid after manual validation:',
      this.addGrantPdfForm.valid
    );
    console.log('Form values:', {
      title: this.addGrantPdfForm.get('title')?.value,
      source: this.addGrantPdfForm.get('source')?.value,
      pdfFileName: this.addGrantPdfForm.get('pdfFileName')?.value,
    });
  }

  // Updated method to initialize the PDF grant form with proper validators
  initAddGrantPdfForm() {
    this.addGrantPdfForm = this.fb.group({
      public: [false],
      title: ['', Validators.required],
      source: ['', Validators.required],
      pdfFileName: ['', Validators.required],
      websiteLink: [''],
      applicationDeadlines: this.fb.array([this.createDeadlineFormGroup()]),
      deadlineType: ['Regular'],
      eligibility_criteria_countries: this.fb.array([this.fb.control('')]),
      eligibility_criteria_provinces: this.fb.array([this.fb.control('')]),
      eligibility_criteria_careerStages: this.fb.array([this.fb.control('')]),
      eligibility_criteria_general: this.fb.array([this.fb.control('')]),
    });

    // For debugging
    console.log('PDF grant form initialized with validators');
  }

  // Improved method to get form arrays by key name
  getFormArrayByKey(arrayName: string): FormArray {
    console.log(`Getting form array for: ${arrayName}`);
    const formArray = this.addGrantPdfForm.get(arrayName) as FormArray;
    if (!formArray) {
      console.error(`Form array not found for: ${arrayName}`);
      return this.fb.array([]);
    }
    return formArray;
  }

  // Array manipulation methods for PDF form
  addDeadlinePdf() {
    const deadlinesArray = this.getFormArrayByKey('applicationDeadlines');
    deadlinesArray.push(this.createDeadlineFormGroup());
  }

  removeDeadlinePdf(index: number) {
    const deadlinesArray = this.getFormArrayByKey('applicationDeadlines');
    if (deadlinesArray.length > 1) {
      deadlinesArray.removeAt(index);
    }
  }

  addItemToPdfArray(arrayName: string) {
    const array = this.getFormArrayByKey(arrayName);
    array.push(this.fb.control(''));
  }

  removeItemFromPdfArray(arrayName: string, index: number) {
    const array = this.getFormArrayByKey(arrayName);
    if (array.length > 1) {
      array.removeAt(index);
    }
  }

  // Improved method to reset the PDF form
  resetAddGrantPdfForm() {
    // Clear the form
    this.addGrantPdfForm.reset({
      public: false,
      title: '',
      source: '',
      pdfFileName: '',
      websiteLink: '',
      deadlineType: 'Regular',
    });

    // Reset state signals
    this.addGrantPdfSuccess.set(null);
    this.addGrantPdfError.set(null);

    // Reset all form arrays
    // List of all form array names
    const formArrayNames = [
      'applicationDeadlines',
      'eligibility_criteria_countries',
      'eligibility_criteria_provinces',
      'eligibility_criteria_careerStages',
      'eligibility_criteria_general',
    ];

    formArrayNames.forEach((arrayName) => {
      const formArray = this.getFormArrayByKey(arrayName);

      // Clear the array
      while (formArray.length > 0) {
        formArray.removeAt(0);
      }

      // Add one empty item
      if (arrayName === 'applicationDeadlines') {
        formArray.push(this.createDeadlineFormGroup());
      } else {
        formArray.push(this.fb.control(''));
      }
    });

    console.log('PDF grant form has been reset');
  }

  // Method to submit the PDF grant form
  addGrantByPdf() {
    console.log('Form validity:', this.addGrantPdfForm.valid);
    console.log('Form values:', this.addGrantPdfForm.value);

    // Check required fields manually
    const titleControl = this.addGrantPdfForm.get('title');
    const sourceControl = this.addGrantPdfForm.get('source');
    const pdfFileNameControl = this.addGrantPdfForm.get('pdfFileName');

    // Check if required fields have values, regardless of form validity
    if (
      !titleControl?.value ||
      !sourceControl?.value ||
      !pdfFileNameControl?.value
    ) {
      this.addGrantPdfError.set(
        'Please fill in all required fields: Title, Source, and PDF file'
      );
      return;
    }

    this.addGrantPdfLoading.set(true);
    this.addGrantPdfSuccess.set(null);
    this.addGrantPdfError.set(null);

    const payload = this.prepareFormData(true);
    console.log('Submitting PDF grant with payload:', payload);

    this.httpService.post('grant/pdf', payload).subscribe({
      next: (result) => {
        this.zone.run(() => {
          console.log('PDF grant added successfully:', result);
          this.addGrantPdfSuccess.set(result);
          this.resetAddGrantPdfForm();
          this.addGrantPdfLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error adding PDF grant:', error);
          this.addGrantPdfError.set(
            `Failed to add grant: ${error.error?.message || 'Unknown error'}`
          );
          this.addGrantPdfLoading.set(false);
        });
      },
    });
  }

  searchForResearchers() {
    // Set loading state
    this.researcherLoading.set(true);

    // Get form values and format them appropriately for the API
    const formValues = this.researcherSearchForm.value;

    // Define search parameters from form values
    // Convert semicolon-separated strings to arrays where needed
    const searchParams = {
      names: formValues.names
        ? formValues.names
            .split(';')
            .map((n: string) => n.trim())
            .filter(Boolean)
        : [],
      faculties: formValues.faculties
        ? formValues.faculties
            .split(';')
            .map((f: string) => f.trim())
            .filter(Boolean)
        : [],
      keywords: formValues.keywords
        ? formValues.keywords
            .split(';')
            .map((k: string) => k.trim())
            .filter(Boolean)
        : [],
      areaOfResearches: formValues.areaOfResearches
        ? formValues.areaOfResearches
            .split(';')
            .map((a: string) => a.trim())
            .filter(Boolean)
        : [],
      disciplines: formValues.disciplines
        ? formValues.disciplines
            .split(';')
            .map((d: string) => d.trim())
            .filter(Boolean)
        : [],
    };

    // If you have a specialized method for researcher search in your HTTP service:
    this.httpService.post('researcher/search', searchParams).subscribe({
      next: (result) => {
        this.zone.run(() => {
          // Update the researchers signal with the new data
          this.researchers.set(result as any[]);

          // Update loading state
          this.researcherLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error searching researchers:', error);

          // Set fallback data in case of error
          this.researchers.set([
            {
              id: 9999,
              title: null,
              firstName: 'Fallback',
              lastName: 'Researcher (API Error)',
              email: 'error@example.com',
              faculty: 'Error Fallback Faculty',
              program: 'Error Fallback Program',
              role: 'Error',
            },
          ]);

          // Update error state
          this.researcherError.set(
            error.message || 'An error occurred while searching for researchers'
          );

          // Update loading state
          this.researcherLoading.set(false);
        });
      },
    });
  }

  researcherFormIsValid(): boolean {
    // Always return true to allow empty searches
    return true;
    // const formValues = this.researcherSearchForm.value;
    // // Check if at least one field has a value
    // return !!(
    //   formValues.names?.trim() ||
    //   formValues.faculties?.trim() ||
    //   formValues.keywords?.trim() ||
    //   formValues.areaOfResearches?.trim() ||
    //   formValues.disciplines?.trim()
    // );
  }

  resetResearcherForm() {
    this.researcherSearchForm.reset();
    this.researchers.set([]);
  }
}
