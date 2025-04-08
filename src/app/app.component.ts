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

interface Project {
  id: number;
  title: string;
  public: boolean;
  source: string;
  status: string;
  length: string;
  websiteLink: string;
  organization: string;
  organizationUrl: string;
  startDate: string;
  endDate: string;
  isContinuous: boolean;
  location: string;
  isArchived: boolean;
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
          title: 'Project endpoints',
          subitems: [
            'Search projects',
            'Get a single project',
            'Add project by parameters',
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
        {
          title: 'Matches endpoints',
          subitems: ['Search matches', 'Get a single match'],
        },
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
  projects = signal<Project[]>([]);

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

  // Add these properties to your component class
  matchSearchForm: FormGroup;
  matches = signal<any[]>([]);
  matchLoading = signal<boolean>(false);
  matchError = signal<string | null>(null);

  // Add these with your other signals in the class
  singleMatch = signal<any>(null);
  singleMatchLoading = signal<boolean>(false);
  singleMatchError = signal<string | null>(null);

  // Add these with your other signals
  singleResearcher = signal<any>(null);
  singleResearcherLoading = signal<boolean>(false);
  singleResearcherError = signal<string | null>(null);

  // Signals for state management
  addResearcherLoading = signal<boolean>(false);
  addResearcherSuccess = signal<any>(null);
  addResearcherError = signal<string | null>(null);

  // Form reference
  addResearcherForm!: FormGroup;

  // Add these signals to your component class
  addResearcherPdfForm!: FormGroup;
  addResearcherPdfLoading = signal(false);
  addResearcherPdfSuccess = signal<any>(null);
  addResearcherPdfError = signal<string | null>(null);

  // Add a property to store the selected file
  selectedGrantPdfFile: File | null = null;
  // Add a property to store the selected researcher PDF file
  selectedResearcherPdfFile: File | null = null;

  researcherUploadUrlResponse = signal<UploadUrlResponse | null>(null);
  researcherUploadUrlError = signal<string | null>(null);
  researcherUploadUrlLoading = signal(false);

  // Add these signals to your component class
  showExperienceSection = signal<boolean>(false);
  showEducationSection = signal<boolean>(false);
  showPublicationsSection = signal<boolean>(false);

  // Add this property declaration to the AppComponent class
  // Place it with the other form declarations
  projectSearchForm!: FormGroup;

  // Add these signals to your AppComponent class
  singleProject = signal<any>(null);
  singleProjectLoading = signal<boolean>(false);
  singleProjectError = signal<string | null>(null);

  // Add these signals to your AppComponent class
  addProjectLoading = signal(false);
  addProjectSuccess = signal<any>(null);
  addProjectError = signal<string | null>(null);

  // Add this form declaration to the AppComponent class
  addProjectForm!: FormGroup;

  // Add this property to your AppComponent class
  includeTriMatch = signal<boolean>(true);

  constructor(
    public httpService: HttpService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    // Initialize the form in constructor
    this.searchForm = this.fb.group({
      titles: [null],
      sources: [null],
      deadlineRangeStart: [null],
      deadlineRangeEnd: [null],
      keywords: [null],
      areaOfResearches: [null],
      disciplines: [null],
      countries: [null],
    });

    // Initialize the add grant form
    this.initAddGrantForm();
    this.initAddGrantPdfForm();

    // Initialize the researcher form
    this.initAddResearcherForm();

    // Initialize the researcher PDF form
    this.initAddResearcherPdfForm();

    // Initialize researcher search form
    this.researcherSearchForm = this.fb.group({
      names: [null],
      faculties: [null],
      keywords: [null],
      areaOfResearches: [null],
      disciplines: [null],
    });

    // Initialize match search form
    this.matchSearchForm = this.fb.group({
      researcherIds: [null],
      grantIds: [null],
      grantSources: [null],
      grantTitles: [null],
      researcherNames: [null],
      projectIds: [null],
      triMatch: [null],
    });

    // Initialize project search form
    this.projectSearchForm = this.fb.group({
      titles: [null],
      organizations: [null],
      keywords: [null],
      areaOfResearches: [null],
      disciplines: [null],
    });

    this.addProjectForm = this.fb.group({
      public: [false],
      title: [null, Validators.required],
      websiteLink: [null],
      scope: [null, Validators.required],
      length: [null],
      startYear: [null],
      startMonth: [null, Validators.required],
      startDay: [null, Validators.required],
      endYear: [null],
      endMonth: [null, Validators.required],
      endDay: [null, Validators.required],
      isContinuous: [false],
      organization: [null],
      organizationUrl: [null, Validators.required],
      organizationLinkedinUrl: [null, Validators.required],
      city: [null],
      state: [null],
      country: [null],
      keywords: this.fb.array([this.fb.control(null)]),
    });
  }
  hideProjectCol = false;

  ngOnInit() {
    // Call in ngOnInit instead of constructor
    // this.getSingleGrant(79084);
    this.initializeFormWithDefaults();

    // Make sure the researcher form is initialized
    if (
      !this.addResearcherForm ||
      !this.addResearcherForm.get('publications')
    ) {
      this.initAddResearcherForm();
    }

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
    // Add subscription to watch isContinuous changes
    this.addProjectForm.get('isContinuous')?.valueChanges.subscribe((value) => {
      if (value === true) {
        // If project is continuing, clear end date fields
        this.addProjectForm.get('endYear')?.setValue(null);
        this.addProjectForm.get('endMonth')?.setValue(null);
        this.addProjectForm.get('endDay')?.setValue(null);

        // Remove validators from end date fields
        this.addProjectForm.get('endYear')?.clearValidators();
        this.addProjectForm.get('endMonth')?.clearValidators();
        this.addProjectForm.get('endDay')?.clearValidators();
      } else {
        // If project is not continuing, add required validators back
        this.addProjectForm
          .get('endYear')
          ?.setValidators([Validators.required]);
        this.addProjectForm
          .get('endMonth')
          ?.setValidators([Validators.required]);
        this.addProjectForm.get('endDay')?.setValidators([Validators.required]);
      }

      // Important: Update validity after changing validators
      this.addProjectForm.get('endYear')?.updateValueAndValidity();
      this.addProjectForm.get('endMonth')?.updateValueAndValidity();
      this.addProjectForm.get('endDay')?.updateValueAndValidity();

      // Update the entire form validity
      this.addProjectForm.updateValueAndValidity();
    });
  }

  sanitizeResearcherIdsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9;]/g, '');

    // Only update if the value actually changed to avoid cursor position issues
    if (sanitized !== input.value) {
      input.value = sanitized;
      // Update the form control value
      this.searchForm.get('researcherIds')?.setValue(sanitized);
    }
  }

  // Initialize form with default values for testing
  initializeFormWithDefaults() {
    this.searchForm.setValue({
      titles: null,
      sources: null,
      deadlineRangeStart: null,
      deadlineRangeEnd: null,
      keywords: null,
      areaOfResearches: null,
      disciplines: null,
      countries: null, // Keeping this as a string since it's a default value
    });
  }

  // Method to initialize the add grant form with default values
  initAddGrantForm() {
    this.addGrantForm = this.fb.group({
      public: [false],
      title: [null, Validators.required],
      source: [null, Validators.required],
      websiteLink: [null],
      summary: [null, Validators.required],
      pdfFileName: [null],
      applicationDeadlines: this.fb.array([this.createDeadlineFormGroup()]),
      deadlineType: ['Regular'], // Keeping this as a string since it's a default value
      budget: [0, [Validators.min(0)]],
      awardAmount: [0, [Validators.min(0)]],
      currencyCode: ['CAD'], // Keeping this as a string since it's a default value
      budgetDescription: [null],
      keywords: this.fb.array([this.fb.control(null)]),
      eligibility_criteria_countries: this.fb.array([this.fb.control(null)]),
      eligibility_criteria_provinces: this.fb.array([this.fb.control(null)]),
      eligibility_criteria_careerStages: this.fb.array([this.fb.control(null)]),
      eligibility_criteria_general: this.fb.array([this.fb.control(null)]),
    });
  }

  // Helper method to create a deadline form group
  createDeadlineFormGroup(): FormGroup {
    return this.fb.group({
      applicationDeadline: [null],
      registrationOfIntentDeadline: [null],
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
    array.push(this.fb.control(null));
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

    // Handle application deadlines specifically - this applies to both form types
    if (formData.applicationDeadlines) {
      // Filter out deadline objects where both values are null or empty
      formData.applicationDeadlines = formData.applicationDeadlines.filter(
        (deadline: any) => {
          // Check if any value in the deadline object is non-empty
          return Object.values(deadline).some(
            (val) => val !== null && String(val).trim() !== ''
          );
        }
      );

      // If all deadlines were empty and we end up with an empty array,
      // check if deadlineType is 'Continuous'
      if (
        formData.applicationDeadlines.length === 0 &&
        formData.deadlineType === 'Continuous'
      ) {
        // For Continuous grants, it's valid to have no deadlines
        // Keep the empty array
      }
    }

    if (isPdfForm) {
      // Handle PDF form arrays
      Object.keys(this.pdfFormArrays).forEach((key) => {
        const arrayKey = key as keyof typeof this.pdfFormArrays;
        if (formData[arrayKey]) {
          // Skip applicationDeadlines as we've already handled it above
          if (arrayKey !== 'applicationDeadlines') {
            formData[arrayKey] = formData[arrayKey].filter((item: any) => {
              if (typeof item === 'string') {
                return item.trim() !== '';
              } else if (typeof item === 'object' && item !== null) {
                return Object.values(item).some(
                  (val) => val && String(val).trim() !== ''
                );
              }
              return false;
            });
          }
        }
      });
    } else {
      // Handle regular form arrays
      formData.keywords = formData.keywords.filter(
        (keyword: string) => keyword && keyword.trim() !== ''
      );
      formData.eligibility_criteria_countries =
        formData.eligibility_criteria_countries.filter(
          (country: string) => country && country.trim() !== ''
        );
      formData.eligibility_criteria_provinces =
        formData.eligibility_criteria_provinces.filter(
          (province: string) => province && province.trim() !== ''
        );
      formData.eligibility_criteria_careerStages =
        formData.eligibility_criteria_careerStages.filter(
          (stage: string) => stage && stage.trim() !== ''
        );
      formData.eligibility_criteria_general =
        formData.eligibility_criteria_general.filter(
          (item: string) => item && item.trim() !== ''
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
      // First get the element's position
      const elementPosition = element.getBoundingClientRect().top;

      // Add offset for the navbar height (adjust the 60px to match your navbar height)
      const offsetPosition = elementPosition - 60;

      // Scroll to the adjusted position
      window.scrollBy({
        top: offsetPosition,
        behavior: 'smooth',
      });
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

    // Use the get method from HttpService
    this.httpService.get(`grant/${id}`).subscribe({
      next: (result: any) => {
        this.zone.run(() => {
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

    // Use the HttpService to make the POST request
    this.httpService.post('grant', payload).subscribe({
      next: (result) => {
        this.zone.run(() => {
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
        // Reset with null values
        this.searchForm.reset({
          titles: null,
          sources: null,
          deadlineRangeStart: null,
          deadlineRangeEnd: null,
          keywords: null,
          areaOfResearches: null,
          disciplines: null,
          countries: null,
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
      formArray.push(this.fb.control(null));
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

  // Method to handle file selection
  onGrantPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedGrantPdfFile = input.files[0];
      console.log('File selected:', this.selectedGrantPdfFile.name);
    }
  }

  // Update the getGrantPdfUploadUrl method to include file upload
  getGrantPdfUploadUrl() {
    // Set loading state
    this.uploadUrlLoading.set(true);
    this.uploadUrlError.set(null);

    // Use the existing HttpService
    this.httpService.get('uploadURL/grant/pdf').subscribe({
      next: (response: any) => {
        this.zone.run(() => {
          this.uploadUrlResponse.set(response as UploadUrlResponse);

          // If we have a file selected, upload it immediately
          if (this.selectedGrantPdfFile) {
            this.uploadGrantPdfFile(response.url);
          } else {
            console.log('No file selected for upload');
            this.uploadUrlLoading.set(false);
          }

          // Set the filename in the form regardless
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
  // Combined method to handle file selection and upload in one step
  onFileSelectedAndUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Store the selected file
      this.selectedGrantPdfFile = input.files[0];
      console.log('File selected:', this.selectedGrantPdfFile.name);

      // Automatically start the upload process
      this.uploadGrantPdf();
    }
  }

  // Method to handle the upload process
  uploadGrantPdf(): void {
    if (!this.selectedGrantPdfFile) {
      this.uploadUrlError.set('Please select a file to upload');
      return;
    }

    // Set loading state
    this.uploadUrlLoading.set(true);
    this.uploadUrlError.set(null);

    // First get the upload URL
    this.httpService.get('uploadURL/grant/pdf').subscribe({
      next: (response: any) => {
        this.zone.run(() => {
          // Store the response
          this.uploadUrlResponse.set(response as UploadUrlResponse);

          // Now upload the file using the URL from the response
          const uploadUrl = response.url;
          const fileId = response.fileId;

          // We've already checked that selectedGrantPdfFile is not null
          if (this.selectedGrantPdfFile) {
            // Upload the file
            this.httpService
              .uploadFile(uploadUrl, this.selectedGrantPdfFile)
              .subscribe({
                next: (result) => {
                  this.zone.run(() => {
                    console.log('File uploaded successfully:', result);

                    // Set the filename in the form
                    this.setPdfFileNameWhenReceived();

                    // Update loading state
                    this.uploadUrlLoading.set(false);
                  });
                },
                error: (error) => {
                  this.zone.run(() => {
                    console.error('Error uploading file:', error);
                    this.uploadUrlError.set(
                      `Failed to upload file: ${
                        error.message || 'Unknown error'
                      }`
                    );
                    this.uploadUrlLoading.set(false);
                  });
                },
              });
          } else {
            this.uploadUrlError.set('File was not selected');
            this.uploadUrlLoading.set(false);
          }
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

  // Combined method to handle researcher file selection and upload in one step
  onResearcherFileSelectedAndUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Store the selected file
      this.selectedResearcherPdfFile = input.files[0];
      console.log(
        'Researcher file selected:',
        this.selectedResearcherPdfFile.name
      );

      // Automatically start the upload process
      this.uploadResearcherPdf();
    }
  }
  // Method to handle the researcher PDF upload process
  uploadResearcherPdf(): void {
    if (!this.selectedResearcherPdfFile) {
      this.researcherUploadUrlError.set('Please select a file to upload');
      return;
    }

    // Set loading state
    this.researcherUploadUrlLoading.set(true);
    this.researcherUploadUrlError.set(null);

    // First get the upload URL
    this.httpService.get('uploadURL/researcher/pdf').subscribe({
      next: (response: any) => {
        this.zone.run(() => {
          // Store the response
          this.researcherUploadUrlResponse.set(response as UploadUrlResponse);

          // Now upload the file using the URL from the response
          const uploadUrl = response.url;
          const fileId = response.fileId;

          // We've already checked that selectedResearcherPdfFile is not null
          if (this.selectedResearcherPdfFile) {
            // Upload the file
            this.httpService
              .uploadFile(uploadUrl, this.selectedResearcherPdfFile)
              .subscribe({
                next: (result) => {
                  this.zone.run(() => {
                    console.log(
                      'Researcher file uploaded successfully:',
                      result
                    );

                    // Set the filename in the form
                    this.setResearcherPdfFileNameWhenReceived();

                    // Update loading state
                    this.researcherUploadUrlLoading.set(false);
                  });
                },
                error: (error) => {
                  this.zone.run(() => {
                    console.error('Error uploading researcher file:', error);
                    this.researcherUploadUrlError.set(
                      `Failed to upload file: ${
                        error.message || 'Unknown error'
                      }`
                    );
                    this.researcherUploadUrlLoading.set(false);
                  });
                },
              });
          } else {
            this.researcherUploadUrlError.set('File was not selected');
            this.researcherUploadUrlLoading.set(false);
          }
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error getting researcher upload URL:', error);
          this.researcherUploadUrlError.set(
            error.message || 'Failed to get upload URL'
          );
          this.researcherUploadUrlLoading.set(false);
        });
      },
    });
  }
  // Add a new method to handle the actual file upload
  uploadGrantPdfFile(uploadUrl: string): void {
    if (!this.selectedGrantPdfFile) {
      console.error('No file selected for upload');
      this.uploadUrlError.set('Please select a file to upload');
      this.uploadUrlLoading.set(false);
      return;
    }

    console.log('Uploading file tofdfs:', uploadUrl);
    console.log('File selected Uploading:', this.uploadUrlResponse()?.fileId);

    this.httpService
      .uploadFile(uploadUrl, this.selectedGrantPdfFile)
      .subscribe({
        next: (result) => {
          this.zone.run(() => {
            console.log('File uploaded successfully:', result);
            this.uploadUrlLoading.set(false);

            // Show success message
            // You might want to add a new signal for upload success
            this.uploadUrlError.set(null);
          });
        },
        error: (error) => {
          this.zone.run(() => {
            console.error('Error uploading file:', error);
            this.uploadUrlError.set(
              `Failed to upload file: ${error.message || 'Unknown error'}`
            );
            this.uploadUrlLoading.set(false);
          });
        },
      });
  }
  // Add the missing method
  setPdfFileNameWhenReceived(): void {
    const response = this.uploadUrlResponse();
    if (response && response.fileId) {
      this.addGrantPdfForm.patchValue({
        pdfFileName: response.fileId,
      });
      // Force update validity
      this.addGrantPdfForm.get('pdfFileName')?.updateValueAndValidity();
      this.addGrantPdfForm.updateValueAndValidity();

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
  }

  // Updated method to initialize the PDF grant form with proper validators
  initAddGrantPdfForm() {
    this.addGrantPdfForm = this.fb.group({
      public: [false],
      title: [null, Validators.required],
      source: [null, Validators.required],
      pdfFileName: [null, Validators.required],
      websiteLink: [null],
      applicationDeadlines: this.fb.array([this.createDeadlineFormGroup()]),
      deadlineType: ['Regular'], // Keeping this as a string since it's a default value
      eligibility_criteria_countries: this.fb.array([this.fb.control(null)]),
      eligibility_criteria_provinces: this.fb.array([this.fb.control(null)]),
      eligibility_criteria_careerStages: this.fb.array([this.fb.control(null)]),
      eligibility_criteria_general: this.fb.array([this.fb.control(null)]),
    });
  }

  // Improved method to get form arrays by key name
  getFormArrayByKey(arrayName: string): FormArray {
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
    array.push(this.fb.control(null));
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
      title: null,
      source: null,
      pdfFileName: null,
      websiteLink: null,
      deadlineType: 'Regular', // Keeping this as a string since it's a default value
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
        formArray.push(this.fb.control(null));
      }
    });
  }

  // Method to submit the PDF grant form
  addGrantByPdf() {
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

    this.httpService.post('grant/pdf', payload).subscribe({
      next: (result) => {
        this.zone.run(() => {
          console.log('PDF grant added successfully:', result);
          // Make sure we're setting the success signal with the response
          this.addGrantPdfSuccess.set(result);
          // Don't reset the form immediately so the user can see the success message
          // We can reset after a delay or let the user manually reset
          // this.resetAddGrantPdfForm();
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

  searchForMatches() {
    // Set loading state
    this.matchLoading.set(true);
    this.matchError.set(null);

    // Get form values and format them appropriately for the API
    const formValues = this.matchSearchForm.value;

    // Define search parameters from form values
    // Convert semicolon-separated strings to arrays where needed
    const searchParams = {
      researcherIds: formValues.researcherIds
        ? formValues.researcherIds
            .split(';')
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id))
        : [],
      grantIds: formValues.grantIds
        ? formValues.grantIds
            .split(';')
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id))
        : [],
      grantSources: formValues.grantSources
        ? formValues.grantSources
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      grantTitles: formValues.grantTitles
        ? formValues.grantTitles
            .split(';')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      researcherNames: formValues.researcherNames
        ? formValues.researcherNames
            .split(';')
            .map((n: string) => n.trim())
            .filter(Boolean)
        : [],
      projectIds: formValues.projectIds
        ? formValues.projectIds
            .split(';')
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id))
        : [],
    };

    // Determine the endpoint URL based on triMatch checkbox
    const endpoint = formValues.triMatch
      ? ((this.hideProjectCol = true), 'match/search?triMatch=true')
      : ((this.hideProjectCol = false), 'match/search');

    // Use the HttpService to make the POST request with the appropriate endpoint
    this.httpService.post(endpoint, searchParams).subscribe({
      next: (result) => {
        this.zone.run(() => {
          // Update the matches signal with the new data
          this.matches.set(result as any[]);

          // Update loading state
          this.matchLoading.set(false);

          // hide column project
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error searching matches:', error);

          // In the error handler of searchForMatches()
          this.matches.set([
            {
              id: 9999,
              score: 0,
              matchedDate: new Date().toISOString(),
              isArchived: false,
              researcherId: 0,
              researcherName: 'Fallback Researcher (API Error)',
              grantId: 0,
              grantTitle: 'Fallback Grant (API Error)',
              grantSource: 'Error Fallback Source',
              projectId: 0,
              projectTitle: 'Fallback Project (API Error)',
              projectOrganization: 'Error Organization',
            },
          ]);

          // Update error state
          this.matchError.set(
            error.message || 'An error occurred while searching for matches'
          );

          // Update loading state
          this.matchLoading.set(false);
        });
      },
    });
  }

  // Helper method to reset match search form
  resetMatchSearchForm() {
    this.matchSearchForm.reset();
    // this.matches.set([]);
    this.matchError.set(null);
  }

  getSingleMatch(id: number | string) {
    // Reset state
    this.singleMatchLoading.set(true);
    this.singleMatchError.set(null);

    // Build the URL with the triMatch parameter based on checkbox state
    const triMatchParam = this.includeTriMatch() ? 'true' : 'false';
    const url = `match/${id}?triMatch=${triMatchParam}`;

    // Use the get method from HttpService with the constructed URL
    this.httpService.get(url).subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          // Update the singleMatch signal with the new data
          this.singleMatch.set(result);

          // Update loading state
          this.singleMatchLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error(`Error fetching match with ID ${id}:`, error);

          // Set error message
          this.singleMatchError.set(
            error.status === 404
              ? `Match with ID ${id} not found`
              : `Error loading match: ${error.message || 'Unknown error'}`
          );

          // Reset data and update loading state
          this.singleMatch.set(null);
          this.singleMatchLoading.set(false);
        });
      },
    });
  }

  // Add this method to toggle the triMatch parameter
  toggleTriMatch() {
    this.includeTriMatch.update((value) => !value);
  }

  /**
   * Get detailed information about a single researcher by ID
   * @param id The unique identifier of the researcher
   */
  getSingleResearcher(id: number | string) {
    // Reset state
    this.singleResearcherLoading.set(true);
    this.singleResearcherError.set(null);

    // Log the action

    // Use the get method from HttpService
    this.httpService.get(`researcher/${id}`).subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          // Update the singleResearcher signal with the new data
          this.singleResearcher.set(result);

          // Update loading state
          this.singleResearcherLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error(`Error fetching researcher with ID ${id}:`, error);

          // Set error message
          this.singleResearcherError.set(
            error.status === 404
              ? `Researcher with ID ${id} not found`
              : `Error loading researcher: ${error.message || 'Unknown error'}`
          );

          // Reset data and update loading state
          this.singleResearcher.set(null);
          this.singleResearcherLoading.set(false);
        });
      },
    });
  }

  // Add this helper method to filter falsy values
  filterNonEmpty(values: any[]): any[] {
    return values.filter((value) => !!value);
  }

  // Update the method to initialize the researcher form with a 'basic' form group
  initAddResearcherForm() {
    this.addResearcherForm = this.fb.group({
      // Add a 'basic' form group to match your template structure
      basic: this.fb.group({
        title: [null], // Researcher's title (e.g., Dr., Er.)
        firstName: [null, Validators.required], // Researcher's first name
        middleName: [null], // Researcher's middle name
        lastName: [null], // Researcher's last name
        email: [null], // Researcher's valid email
        gender: [null], // Researcher's gender identity
        linkedinUrl: [null], // Researcher's LinkedIn profile URL
        biography: [null], // Researcher's biography
        researchInterests: [null], // Researcher's research interests
        faculty: [null], // Researcher's faculty
        program: [null], // Researcher's enrolled program
        role: [null], // Researcher's role (e.g., Associate Professor)
        organization: [null], // Researcher's associated organization
        facultyURL: [null], // URL of the researcher's faculty
        country: [null], // Researcher's country of residence
        city: [null], // Researcher's city of residence
        state: [null], // Researcher's state of residence
        keywords: this.fb.array([]), // Empty array
        areaOfResearches: this.fb.array([]), // Empty array
        disciplines: this.fb.array([]), // Empty array
      }),

      experience: this.fb.array([
        this.fb.group({
          title: [null],
          type: [null],
          department: [null],
          industry: [null],
          startYear: [null],
          startMonth: [null],
          startDay: [null],
          endYear: [null],
          endMonth: [null],
          endDay: [null],
          isCurrent: [false],
          organizationName: [null],
          organizationUrl: [null],
          organizationLinkedinUrl: [null],
          country: [null],
          state: [null],
          city: [null],
          summary: [null],
        }),
      ]),

      education: this.fb.array([
        this.fb.group({
          degree: [null],
          major: [null],
          grade: [null],
          startYear: [null],
          startMonth: [null],
          startDay: [null],
          endYear: [null],
          endMonth: [null],
          endDay: [null],
          isCurrent: [false],
          instituteName: [null],
          institutionUrl: [null],
          instituteLinkedinUrl: [null],
          country: [null],
          state: [null],
          city: [null],
          summary: [null],
        }),
      ]),

      publications: this.fb.array([
        this.fb.group({
          title: [null],
          status: [null],
          publisher: [null],
          type: [null],
          url: [null],
          publishedYear: [null],
          publishedMonth: [null],
          publishedDay: [null],
          summary: [null],
        }),
      ]),
    });
  }

  // Add a getter for the basic form group
  get basicInfo(): FormGroup {
    return this.addResearcherForm.get('basic') as FormGroup;
  }

  // Add these getter methods for the form arrays with null checks
  get basicKeywordsArray(): FormArray {
    return (
      (this.addResearcherForm.get('basic.keywords') as FormArray) ||
      this.fb.array([])
    );
  }

  get basicAreaOfResearchesArray(): FormArray {
    return (
      (this.addResearcherForm.get('basic.areaOfResearches') as FormArray) ||
      this.fb.array([])
    );
  }

  get basicDisciplinesArray(): FormArray {
    return (
      (this.addResearcherForm.get('basic.disciplines') as FormArray) ||
      this.fb.array([])
    );
  }

  get experienceArray(): FormArray {
    return (
      (this.addResearcherForm.get('experience') as FormArray) ||
      this.fb.array([])
    );
  }

  get educationArray(): FormArray {
    return (
      (this.addResearcherForm.get('education') as FormArray) ||
      this.fb.array([])
    );
  }

  get publicationsArray(): FormArray {
    return (
      (this.addResearcherForm.get('publications') as FormArray) ||
      this.fb.array([])
    );
  }

  // Add methods to add/remove items from the basic arrays
  addBasicArrayItem(arrayPath: string) {
    const pathParts = arrayPath.split('.');
    let formGroup = this.addResearcherForm;

    // Navigate to the correct form group if path is nested
    if (pathParts.length > 1) {
      for (let i = 0; i < pathParts.length - 1; i++) {
        formGroup = formGroup.get(pathParts[i]) as FormGroup;
      }
    }

    const arrayName = pathParts[pathParts.length - 1];
    const array = formGroup.get(arrayName) as FormArray;

    if (array) {
      array.push(this.fb.control(null));
    }
  }

  removeBasicArrayItem(arrayPath: string, index: number) {
    const pathParts = arrayPath.split('.');
    let formGroup = this.addResearcherForm;

    // Navigate to the correct form group if path is nested
    if (pathParts.length > 1) {
      for (let i = 0; i < pathParts.length - 1; i++) {
        formGroup = formGroup.get(pathParts[i]) as FormGroup;
      }
    }

    const arrayName = pathParts[pathParts.length - 1];
    const array = formGroup.get(arrayName) as FormArray;

    if (array && array.length > 1) {
      array.removeAt(index);
    }
  }

  // In your addExperience method
  addExperience() {
    const titleValidators = this.showExperienceSection()
      ? [Validators.required]
      : [];
    const experienceGroup = this.fb.group({
      title: [null, titleValidators],
      type: [null],
      department: [null],
      industry: [null],
      startYear: [null],
      startMonth: [null],
      startDay: [null],
      endYear: [null],
      endMonth: [null],
      endDay: [null],
      isCurrent: [false],
      organizationName: [null, titleValidators],
      organizationUrl: [null],
      organizationLinkedinUrl: [null],
      country: [null],
      state: [null],
      city: [null],
      summary: [null],
    });

    // Add listener to handle "I currently work here" checkbox
    const isCurrentControl = experienceGroup.get('isCurrent');
    if (isCurrentControl) {
      isCurrentControl.valueChanges.subscribe((isCurrent) => {
        if (isCurrent) {
          // Clear end date fields when "I currently work here" is checked
          experienceGroup.get('endYear')?.setValue(null);
          experienceGroup.get('endMonth')?.setValue(null);
          experienceGroup.get('endDay')?.setValue(null);
        }
      });
    }

    // Only push the experienceGroup once
    // Use the direct form array access rather than the getter
    const array = this.addResearcherForm.get('experience') as FormArray;
    if (array) {
      array.push(experienceGroup);
    }
  }

  removeExperience(index: number) {
    const array = this.addResearcherForm.get('experience') as FormArray;
    if (array && array.length > 1) {
      array.removeAt(index);
    }
  }

  // Add methods to manage education items
  addEducation() {
    const array = this.addResearcherForm.get('education') as FormArray;
    const eduValidators = this.showEducationSection()
      ? [Validators.required]
      : [];

    if (array) {
      array.push(
        this.fb.group({
          degree: [null, eduValidators],
          major: [null],
          grade: [null],
          startYear: [null],
          startMonth: [null],
          startDay: [null],
          endYear: [null],
          endMonth: [null],
          endDay: [null],
          isCurrent: [false],
          instituteName: [null, eduValidators],
          institutionUrl: [null],
          instituteLinkedinUrl: [null],
          country: [null],
          state: [null],
          city: [null],
          summary: [null],
        })
      );
    }
  }

  removeEducation(index: number) {
    const array = this.addResearcherForm.get('education') as FormArray;
    if (array && array.length > 1) {
      array.removeAt(index);
    }
  }

  // Update the addPublication method
  addPublication() {
    const array = this.addResearcherForm.get('publications') as FormArray;
    const pubValidators = this.showPublicationsSection()
      ? [Validators.required]
      : [];

    if (array) {
      array.push(
        this.fb.group({
          title: [null, pubValidators],
          status: [null],
          publisher: [null],
          type: [null],
          url: [null],
          publishedYear: [null],
          publishedMonth: [null],
          publishedDay: [null],
          summary: [null],
        })
      );
    }
  }

  removePublication(index: number) {
    const array = this.addResearcherForm.get('publications') as FormArray;
    if (array && array.length > 1) {
      array.removeAt(index);
    }
  }
  // Helper method to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          if (control.at(i) instanceof FormGroup) {
            this.markFormGroupTouched(control.at(i) as FormGroup);
          }
        }
      }
    });
  }
  addResearcherByParameters() {
    // Mark all fields as touched to trigger validation
    this.markFormGroupTouched(this.addResearcherForm);

    // Check if form is valid
    if (this.addResearcherForm.invalid) {
      console.error('Form is invalid:', this.addResearcherForm.errors);

      // If experience section is shown and there are experiences, check if they're valid
      if (this.showExperienceSection() && this.experienceArray.length > 0) {
        let experiencesValid = true;

        for (let i = 0; i < this.experienceArray.length; i++) {
          const exp = this.experienceArray.at(i);
          if (
            exp.get('title')?.invalid ||
            exp.get('organizationName')?.invalid
          ) {
            experiencesValid = false;
            break;
          }
        }

        if (!experiencesValid) {
          this.addResearcherError.set(
            'Please provide a job title and organization name for all experiences'
          );
          return;
        }
      }

      // If education section is shown and there are educations, check if they're valid
      if (this.showEducationSection() && this.educationArray.length > 0) {
        let educationsValid = true;

        for (let i = 0; i < this.educationArray.length; i++) {
          const edu = this.educationArray.at(i);
          if (edu.get('instituteName')?.invalid || edu.get('degree')?.invalid) {
            educationsValid = false;
            break;
          }
        }

        if (!educationsValid) {
          this.addResearcherError.set(
            'Please provide institution name and degree for all education entries'
          );
          return;
        }
      }

      // If publications section is shown and there are publications, check if they're valid
      if (this.showPublicationsSection() && this.publicationsArray.length > 0) {
        let publicationsValid = true;

        for (let i = 0; i < this.publicationsArray.length; i++) {
          const pub = this.publicationsArray.at(i);
          if (pub.get('title')?.invalid) {
            publicationsValid = false;
            break;
          }
        }

        if (!publicationsValid) {
          this.addResearcherError.set(
            'Please provide a title for all publications'
          );
          return;
        }
      }

      this.addResearcherError.set(
        'Please fill in all required fields correctly'
      );
      return;
    }

    // Reset state
    this.addResearcherLoading.set(true);
    this.addResearcherSuccess.set(null);
    this.addResearcherError.set(null);

    // Get form values and prepare payload
    const payload = this.prepareResearcherFormData();

    // Use the HttpService to make the POST request
    this.httpService.post('researcher', payload).subscribe({
      next: (result) => {
        this.zone.run(() => {
          // Update success signal with the result data
          this.addResearcherSuccess.set(result);

          // Reset form
          this.initAddResearcherForm();

          // Update loading state
          this.addResearcherLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error adding researcher:', error);

          // Set error message
          this.addResearcherError.set(
            `Failed to add researcher: ${
              error.error?.message || 'Unknown error'
            }`
          );

          // Update loading state
          this.addResearcherLoading.set(false);
        });
      },
    });
  }

  /**
   * Helper method to prepare researcher form data for submission
   * Filters out empty arrays and formats data as needed
   */
  prepareResearcherFormData() {
    const formData = { ...this.addResearcherForm.value };

    // Filter out empty keywords, areaOfResearches, and disciplines
    if (formData.basic && formData.basic.keywords) {
      formData.basic.keywords = formData.basic.keywords.filter(
        (keyword: string) => keyword && keyword.trim() !== ''
      );
      if (formData.basic.keywords.length === 0) {
        delete formData.basic.keywords;
      }
    }

    if (formData.basic && formData.basic.areaOfResearches) {
      formData.basic.areaOfResearches = formData.basic.areaOfResearches.filter(
        (area: string) => area && area.trim() !== ''
      );
      if (formData.basic.areaOfResearches.length === 0) {
        delete formData.basic.areaOfResearches;
      }
    }

    if (formData.basic && formData.basic.disciplines) {
      formData.basic.disciplines = formData.basic.disciplines.filter(
        (discipline: string) => discipline && discipline.trim() !== ''
      );
      if (formData.basic.disciplines.length === 0) {
        delete formData.basic.disciplines;
      }
    }

    // Filter out empty experience entries
    if (formData.experience) {
      formData.experience = formData.experience.filter(
        (exp: any) =>
          exp.organizationName &&
          exp.organizationName.trim() !== '' &&
          exp.title &&
          exp.title.trim() !== ''
      );

      // Clean null values and empty strings from experience objects
      formData.experience = formData.experience.map((exp: any) => {
        const cleanExp = { ...exp };
        Object.keys(cleanExp).forEach((key) => {
          if (cleanExp[key] === null || cleanExp[key] === '') {
            delete cleanExp[key];
          }
        });
        return cleanExp;
      });

      if (formData.experience.length === 0) {
        delete formData.experience;
      }
    }

    // Filter out empty education entries
    if (formData.education) {
      formData.education = formData.education.filter(
        (edu: any) =>
          edu.instituteName &&
          edu.instituteName.trim() !== '' &&
          edu.degree &&
          edu.degree.trim() !== ''
      );

      // Clean null values and empty strings from education objects
      formData.education = formData.education.map((edu: any) => {
        const cleanEdu = { ...edu };
        Object.keys(cleanEdu).forEach((key) => {
          if (cleanEdu[key] === null || cleanEdu[key] === '') {
            delete cleanEdu[key];
          }
        });
        return cleanEdu;
      });

      if (formData.education.length === 0) {
        delete formData.education;
      }
    }

    // IMPORTANT: Always rename publications to publication
    // First, handle the publications array if it exists
    if (formData.publications) {
      // Filter out empty publication entries
      formData.publications = formData.publications.filter(
        (pub: any) => pub.title && pub.title.trim() !== ''
      );

      // Clean each publication object by removing null values and empty strings
      formData.publications = formData.publications.map((pub: any) => {
        const cleanPub = { ...pub };
        Object.keys(cleanPub).forEach((key) => {
          if (cleanPub[key] === null || cleanPub[key] === '') {
            delete cleanPub[key];
          }
        });
        return cleanPub;
      });

      // Always create the publication property with the cleaned publications array
      formData.publication = formData.publications;

      // Always delete the original publications property
      delete formData.publications;

      // Only delete the publication property if it's an empty array
      if (formData.publication.length === 0) {
        delete formData.publication;
      }
    }

    // Clean null values AND empty strings from the basic object
    if (formData.basic) {
      Object.keys(formData.basic).forEach((key) => {
        if (formData.basic[key] === null || formData.basic[key] === '') {
          delete formData.basic[key];
        }
      });
    }

    return formData;
  }

  /**
   * Reset the researcher form
   */
  resetAddResearcherForm() {
    // Clear the form
    this.addResearcherForm.reset();

    // Reset success/error states
    this.addResearcherSuccess.set(null);
    this.addResearcherError.set(null);

    // Reset form arrays to initial state
    this.resetResearcherFormArrays();
  }

  /**
   * Helper method to reset all form arrays in researcher form
   */
  resetResearcherFormArrays() {
    // Reset basic arrays
    ['keywords', 'areaOfResearches', 'disciplines'].forEach((arrayName) => {
      const array = this.addResearcherForm.get(
        'basic.' + arrayName
      ) as FormArray;
      if (array) {
        while (array.length > 0) {
          array.removeAt(0);
        }
        // Don't add any default items to keep arrays empty
      }
    });

    // Reset experience array
    const expArray = this.experienceArray;
    while (expArray.length > 0) {
      expArray.removeAt(0);
    }
    expArray.push(
      this.fb.group({
        title: [null],
        type: [null],
        department: [null],
        industry: [null],
        startYear: [null],
        startMonth: [null],
        startDay: [null],
        endYear: [null],
        endMonth: [null],
        endDay: [null],
        isCurrent: [false],
        organizationName: [null],
        organizationUrl: [null],
        organizationLinkedinUrl: [null],
        country: [null],
        state: [null],
        city: [null],
        summary: [null],
      })
    );

    // Reset education array
    const eduArray = this.educationArray;
    while (eduArray.length > 0) {
      eduArray.removeAt(0);
    }
    eduArray.push(
      this.fb.group({
        degree: [null],
        major: [null],
        grade: [null],
        startYear: [null],
        startMonth: [null],
        startDay: [null],
        endYear: [null],
        endMonth: [null],
        endDay: [null],
        isCurrent: [false],
        instituteName: [null],
        institutionUrl: [null],
        instituteLinkedinUrl: [null],
        country: [null],
        state: [null],
        city: [null],
        summary: [null],
      })
    );

    // Reset publication array
    const pubArray = this.publicationsArray;
    while (pubArray.length > 0) {
      pubArray.removeAt(0);
    }
    pubArray.push(
      this.fb.group({
        title: [null],
        status: [null],
        publisher: [null],
        type: [null],
        url: [null],
        publishedYear: [null],
        publishedMonth: [null],
        publishedDay: [null],
        summary: [null],
      })
    );
  }

  /**
   * Format the date components into a string for the date input
   * @param year The year value
   * @param month The month value (1-12)
   * @param day The day value
   * @returns A date string in YYYY-MM-DD format
   */
  formatDateForInput(
    year: number | null,
    month: number | null,
    day: number | null
  ): string {
    if (!year || !month || !day) {
      return '';
    }

    // Format month and day to ensure they have two digits
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  /**
   * Update the individual date fields when the date input changes
   * @param event The change event
   * @param index The index of the publication in the form array
   */
  updatePublicationDate(event: Event, index: number): void {
    const dateValue = (event.target as HTMLInputElement).value;

    if (dateValue) {
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      const publicationGroup = (
        this.addResearcherForm.get('publications') as FormArray
      ).at(index) as FormGroup;

      publicationGroup.get('publishedYear')?.setValue(year);
      publicationGroup.get('publishedMonth')?.setValue(month);
      publicationGroup.get('publishedDay')?.setValue(day);
    } else {
      // If date is cleared, reset all fields
      const publicationGroup = (
        this.addResearcherForm.get('publications') as FormArray
      ).at(index) as FormGroup;

      publicationGroup.get('publishedYear')?.setValue(null);
      publicationGroup.get('publishedMonth')?.setValue(null);
      publicationGroup.get('publishedDay')?.setValue(null);
    }
  }
  /**
   * Update the education start date fields when the date input changes
   * @param event The change event
   * @param index The index of the education in the form array
   */
  updateEducationStartDate(event: Event, index: number): void {
    const dateValue = (event.target as HTMLInputElement).value;

    if (dateValue) {
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      const educationGroup = (
        this.addResearcherForm.get('education') as FormArray
      ).at(index) as FormGroup;

      educationGroup.get('startYear')?.setValue(year);
      educationGroup.get('startMonth')?.setValue(month);
      educationGroup.get('startDay')?.setValue(day);
    } else {
      // If date is cleared, reset all fields
      const educationGroup = (
        this.addResearcherForm.get('education') as FormArray
      ).at(index) as FormGroup;

      educationGroup.get('startYear')?.setValue(null);
      educationGroup.get('startMonth')?.setValue(null);
      educationGroup.get('startDay')?.setValue(null);
    }
  }

  /**
   * Update the education end date fields when the date input changes
   * @param event The change event
   * @param index The index of the education in the form array
   */
  updateEducationEndDate(event: Event, index: number): void {
    const dateValue = (event.target as HTMLInputElement).value;

    if (dateValue) {
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      const educationGroup = (
        this.addResearcherForm.get('education') as FormArray
      ).at(index) as FormGroup;

      educationGroup.get('endYear')?.setValue(year);
      educationGroup.get('endMonth')?.setValue(month);
      educationGroup.get('endDay')?.setValue(day);
    } else {
      // If date is cleared, reset all fields
      const educationGroup = (
        this.addResearcherForm.get('education') as FormArray
      ).at(index) as FormGroup;

      educationGroup.get('endYear')?.setValue(null);
      educationGroup.get('endMonth')?.setValue(null);
      educationGroup.get('endDay')?.setValue(null);
    }
  }
  /**
   * Update the experience start date fields when the date input changes
   * @param event The change event
   * @param index The index of the experience in the form array
   */
  updateExperienceStartDate(event: Event, index: number): void {
    const dateValue = (event.target as HTMLInputElement).value;

    if (dateValue) {
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      const experienceGroup = (
        this.addResearcherForm.get('experience') as FormArray
      ).at(index) as FormGroup;

      experienceGroup.get('startYear')?.setValue(year);
      experienceGroup.get('startMonth')?.setValue(month);
      experienceGroup.get('startDay')?.setValue(day);
    } else {
      // If date is cleared, reset all fields
      const experienceGroup = (
        this.addResearcherForm.get('experience') as FormArray
      ).at(index) as FormGroup;

      experienceGroup.get('startYear')?.setValue(null);
      experienceGroup.get('startMonth')?.setValue(null);
      experienceGroup.get('startDay')?.setValue(null);
    }
  }

  /**
   * Update the experience end date fields when the date input changes
   * @param event The change event
   * @param index The index of the experience in the form array
   */
  updateExperienceEndDate(event: Event, index: number): void {
    const dateValue = (event.target as HTMLInputElement).value;
    if (dateValue) {
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      const experienceGroup = (
        this.addResearcherForm.get('experience') as FormArray
      ).at(index) as FormGroup;

      experienceGroup.get('endYear')?.setValue(year);
      experienceGroup.get('endMonth')?.setValue(month);
      experienceGroup.get('endDay')?.setValue(day);
    } else {
      // If date is cleared, reset all fields
      const experienceGroup = (
        this.addResearcherForm.get('experience') as FormArray
      ).at(index) as FormGroup;

      experienceGroup.get('endYear')?.setValue(null);
      experienceGroup.get('endMonth')?.setValue(null);
      experienceGroup.get('endDay')?.setValue(null);
    }
  }
  // Add this method to initialize the researcher PDF form
  initAddResearcherPdfForm() {
    this.addResearcherPdfForm = this.fb.group({
      basic: this.fb.group({
        title: [null],
        firstName: [null, Validators.required],
        lastName: [null, Validators.required],
        email: [null],
        linkedinUrl: [null],
        country: [null],
        state: [null],
        city: [null],
        pdfFileName: [null, Validators.required],
      }),
    });
  }

  // Add this method to get upload URL for researcher PDF
  getResearcherPdfUploadUrl() {
    // Set loading state
    this.researcherUploadUrlLoading.set(true);
    this.researcherUploadUrlError.set(null);

    // Use the existing HttpService
    this.httpService.get('uploadURL/researcher/pdf').subscribe({
      next: (response: any) => {
        this.zone.run(() => {
          console.log('Upload URL response:', response);
          this.researcherUploadUrlResponse.set(response as UploadUrlResponse);
          this.researcherUploadUrlLoading.set(false);

          // Automatically call the method to set PDF filename
          this.setResearcherPdfFileNameWhenReceived();
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error getting upload URL:', error);
          this.researcherUploadUrlError.set(
            error.message || 'Failed to get upload URL'
          );
          this.researcherUploadUrlLoading.set(false);
        });
      },
    });
  }

  // Add this method to set the PDF filename in the form
  setResearcherPdfFileNameWhenReceived(): void {
    const response = this.researcherUploadUrlResponse();
    if (response && response.fileId) {
      console.log('Setting PDF filename to:', response.fileId);
      this.addResearcherPdfForm.get('basic')?.patchValue({
        pdfFileName: response.fileId,
      });
      // Force update validity
      this.addResearcherPdfForm
        .get('basic.pdfFileName')
        ?.updateValueAndValidity();
      this.addResearcherPdfForm.updateValueAndValidity();
      console.log(
        'Form valid after setting filename:',
        this.addResearcherPdfForm.valid
      );

      // Force change detection
      this.cdr.detectChanges();
    } else {
      console.log('No response or fileId to set');
    }
  }

  // Add this method to submit the researcher PDF form
  addResearcherByPdf() {
    console.log('Form validity:', this.addResearcherPdfForm.valid);
    console.log('Form values:', this.addResearcherPdfForm.value);

    // Check required fields manually
    const basicGroup = this.addResearcherPdfForm.get('basic');
    const firstNameControl = basicGroup?.get('firstName');
    const pdfFileNameControl = basicGroup?.get('pdfFileName');

    // Check if required fields have values, regardless of form validity
    if (!firstNameControl?.value || !pdfFileNameControl?.value) {
      this.addResearcherPdfError.set(
        'Please fill in all required fields: First Name, Last Name, and PDF file'
      );
      return;
    }

    this.addResearcherPdfLoading.set(true);
    this.addResearcherPdfSuccess.set(null);
    this.addResearcherPdfError.set(null);

    const payload = this.prepareResearcherPdfFormData();
    console.log('Submitting PDF researcher with payload:', payload);

    this.httpService.post('researcher/pdf', payload).subscribe({
      next: (result) => {
        this.zone.run(() => {
          console.log('PDF researcher added successfully:', result);
          // Store the success response in the signal
          this.addResearcherPdfSuccess.set(result);
          // Don't reset the form immediately so the user can see the success message
          // this.resetAddResearcherPdfForm();
          this.addResearcherPdfLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error adding PDF researcher:', error);
          this.addResearcherPdfError.set(
            `Failed to add researcher: ${
              error.error?.message || 'Unknown error'
            }`
          );
          this.addResearcherPdfLoading.set(false);
        });
      },
    });
  }

  /**
   * Helper method to prepare researcher PDF form data
   * Removes empty arrays and null values from the payload
   */
  prepareResearcherPdfFormData() {
    // Get a copy of the form values
    const formData = { ...this.addResearcherPdfForm.value };

    // Clean up the basic object if it exists
    if (formData.basic) {
      // Remove null values from basic object
      Object.keys(formData.basic).forEach((key) => {
        if (formData.basic[key] === null) {
          delete formData.basic[key];
        }
      });
    }

    return formData;
  }

  // Method to reset the researcher PDF form
  resetAddResearcherPdfForm() {
    // Clear the form
    this.addResearcherPdfForm.reset({
      basic: {
        title: null,
        firstName: null,
        lastName: null,
        email: null,
        linkedinUrl: null,
        country: null,
        state: null,
        city: null,
        pdfFileName: null,
      },
    });

    // Reset state signals
    this.addResearcherPdfSuccess.set(null);
    this.addResearcherPdfError.set(null);

    // Reset the selected file if you're using the combined file selection approach
    this.selectedResearcherPdfFile = null;
    console.log('PDF researcher form has been reset');
  }
  // Add this method to toggle the experience section
  toggleExperienceSection() {
    const currentValue = this.showExperienceSection();
    this.showExperienceSection.set(!currentValue);

    // If we're showing the section and there are no experiences yet, add one
    if (!currentValue && this.experienceArray.length === 0) {
      this.addExperience();
    }

    // If we're showing the experience section, update validators for all experience forms
    if (!currentValue) {
      this.updateExperienceValidators(true);
    } else {
      // If we're hiding the section, remove validators
      this.updateExperienceValidators(false);
    }
  }
  // Toggle method for Education section
  toggleEducationSection() {
    const currentValue = this.showEducationSection();
    this.showEducationSection.set(!currentValue);

    // If we're showing the section and there are no educations yet, add one
    if (!currentValue && this.educationArray.length === 0) {
      this.addEducation();
    }

    // Update validators based on visibility
    if (!currentValue) {
      this.updateEducationValidators(true);
    } else {
      this.updateEducationValidators(false);
    }
  }

  // Toggle method for Publications section
  togglePublicationsSection() {
    const currentValue = this.showPublicationsSection();
    this.showPublicationsSection.set(!currentValue);

    // If we're showing the section and there are no publications yet, add one
    if (!currentValue && this.publicationsArray.length === 0) {
      this.addPublication();
    }

    // Update validators based on visibility
    if (!currentValue) {
      this.updatePublicationValidators(true);
    } else {
      this.updatePublicationValidators(false);
    }
  }

  updateExperienceValidators(required: boolean) {
    for (let i = 0; i < this.experienceArray.length; i++) {
      const exp = this.experienceArray.at(i);
      if (required) {
        exp.get('title')?.setValidators([Validators.required]);
        exp.get('organizationName')?.setValidators([Validators.required]);
      } else {
        exp.get('title')?.clearValidators();
        exp.get('organizationName')?.clearValidators();
      }
      exp.get('title')?.updateValueAndValidity();
      exp.get('organizationName')?.updateValueAndValidity();
    }
  }
  // Method to update Education validators
  updateEducationValidators(required: boolean) {
    for (let i = 0; i < this.educationArray.length; i++) {
      const edu = this.educationArray.at(i);
      if (required) {
        edu.get('instituteName')?.setValidators([Validators.required]);
        edu.get('degree')?.setValidators([Validators.required]);
      } else {
        edu.get('instituteName')?.clearValidators();
        edu.get('degree')?.clearValidators();
      }
      edu.get('instituteName')?.updateValueAndValidity();
      edu.get('degree')?.updateValueAndValidity();
    }
  }

  // Method to update Publication validators
  updatePublicationValidators(required: boolean) {
    for (let i = 0; i < this.publicationsArray.length; i++) {
      const pub = this.publicationsArray.at(i);
      if (required) {
        pub.get('title')?.setValidators([Validators.required]);
      } else {
        pub.get('title')?.clearValidators();
      }
      pub.get('title')?.updateValueAndValidity();
    }
  }

  // Add these methods to your class:

  /**
   * Search for projects using the provided filters
   */
  searchForProjects() {
    // Set loading state
    this.isLoading.set(true);

    // Get form values and format them appropriately for the API
    const formValues = this.projectSearchForm.value;

    // Define search parameters from form values
    // Convert semicolon-separated strings to arrays where needed
    const searchParams = {
      titles: formValues.titles
        ? formValues.titles
            .split(';')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      organizations: formValues.organizations
        ? formValues.organizations
            .split(';')
            .map((o: string) => o.trim())
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

    this.httpService.post('project/search', searchParams).subscribe({
      next: (result) => {
        this.zone.run(() => {
          // Update the projects signal with the new data
          this.projects.set(result as Project[]);

          // Update loading state
          this.isLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error searching projects:', error);

          // Set fallback data in case of error
          this.projects.set([
            {
              id: 9999,
              title: 'Fallback Project (API Error)',
              public: true,
              source: 'Error Fallback Source',
              status: 'Error',
              length: 'Unknown',
              websiteLink: '',
              organization: 'Error Organization',
              organizationUrl: '',
              startDate: '',
              endDate: '',
              isContinuous: false,
              location: 'Unknown',
              isArchived: false,
            },
          ]);

          // Update loading state
          this.isLoading.set(false);
        });
      },
    });
  }

  /**
   * Reset the project search form
   */
  resetProjectForm() {
    // Use setTimeout to ensure this runs after current change detection cycle
    setTimeout(() => {
      this.zone.run(() => {
        // Reset with null values
        this.projectSearchForm.reset({
          titles: null,
          organizations: null,
          keywords: null,
          areaOfResearches: null,
          disciplines: null,
        });

        // Clear the results (optional)
        // this.projects.set([]);

        // Force change detection
        this.cdr.detectChanges();
      });
    }, 0);
  }

  /**
   * Get detailed information about a single project by ID
   * @param id The unique identifier of the project
   */
  getSingleProject(id: number | string) {
    // Reset state
    this.singleProjectLoading.set(true);
    this.singleProjectError.set(null);

    // Use the get method from HttpService
    this.httpService.get(`project/${id}`).subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          // Update the singleProject signal with the new data
          this.singleProject.set(result);

          // Update loading state
          this.singleProjectLoading.set(false);
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error(`Error fetching project with ID ${id}:`, error);

          // Set error message
          this.singleProjectError.set(
            error.status === 404
              ? `Project with ID ${id} not found`
              : `Error loading project: ${error.message || 'Unknown error'}`
          );

          // Reset data and update loading state
          this.singleProject.set(null);
          this.singleProjectLoading.set(false);
        });
      },
    });
  }

  // Modify the initAddProjectForm method to set up the form with proper validation
  initAddProjectForm() {
    this.addProjectForm = this.fb.group({
      public: [false],
      title: [null, [Validators.required]],
      websiteLink: [null],
      scope: [null, [Validators.required]],
      length: [null],
      startYear: [null, [Validators.required]],
      startMonth: [null, [Validators.required]],
      startDay: [null, [Validators.required]],
      // For end date fields, don't set required validators initially
      // We'll set them conditionally based on isContinuous
      endYear: [null],
      endMonth: [null],
      endDay: [null],
      isContinuous: [false],
      organization: [null],
      organizationUrl: [null],
      organizationLinkedinUrl: [null],
      city: [null],
      state: [null],
      country: [null],
      keywords: this.fb.array([this.fb.control(null)]),
    });

    // Set validators based on initial isContinuous value
    if (!this.addProjectForm.get('isContinuous')?.value) {
      this.addProjectForm.get('endYear')?.setValidators([Validators.required]);
      this.addProjectForm.get('endMonth')?.setValidators([Validators.required]);
      this.addProjectForm.get('endDay')?.setValidators([Validators.required]);

      this.addProjectForm.get('endYear')?.updateValueAndValidity();
      this.addProjectForm.get('endMonth')?.updateValueAndValidity();
      this.addProjectForm.get('endDay')?.updateValueAndValidity();
    }
  }
  // Add a new method to update end date validators based on isContinuous value
  updateEndDateValidators(isContinuing: boolean) {
    const endYearControl = this.addProjectForm.get('endYear');
    const endMonthControl = this.addProjectForm.get('endMonth');
    const endDayControl = this.addProjectForm.get('endDay');

    if (isContinuing) {
      // If project is continuing, remove all validators from end date fields
      endYearControl?.clearValidators();
      endMonthControl?.clearValidators();
      endDayControl?.clearValidators();

      // Disable the end year field
      endYearControl?.disable();

      // Clear all end date values
      endYearControl?.setValue(null);
      endMonthControl?.setValue(null);
      endDayControl?.setValue(null);
    } else {
      // If project has a specific end date, add required validators to all end date fields
      endYearControl?.enable();
      endYearControl?.setValidators([Validators.required]);
      endMonthControl?.setValidators([Validators.required]);
      endDayControl?.setValidators([Validators.required]);
    }

    // Update validity after changing validators
    endYearControl?.updateValueAndValidity();
    endMonthControl?.updateValueAndValidity();
    endDayControl?.updateValueAndValidity();

    // Update the entire form validity
    this.addProjectForm.updateValueAndValidity();
  }

  /**
   * Adds a new project to the system by providing structured parameters
   * This triggers the AI stack and Area of Research(AOR) attachment
   * Note: AI processing takes approximately 10 minutes to complete
   */
  addProjectByParameters() {
    // Mark all fields as touched to trigger validation messages
    this.markFormGroupTouched(this.addProjectForm);

    // Check if form is valid
    if (this.addProjectForm.invalid) {
      console.error('Project form is invalid:', this.addProjectForm.errors);
      console.log('Form values:', this.addProjectForm.value);
      console.log('Form status:', this.addProjectForm.status);

      // Log specific control statuses to help debug
      console.log('Title valid:', this.addProjectForm.get('title')?.valid);
      console.log('Summary valid:', this.addProjectForm.get('summary')?.valid);
      console.log(
        'Start date valid:',
        this.addProjectForm.get('startYear')?.valid &&
          this.addProjectForm.get('startMonth')?.valid &&
          this.addProjectForm.get('startDay')?.valid
      );
      console.log(
        'isContinuous:',
        this.addProjectForm.get('isContinuous')?.value
      );
      console.log(
        'End date fields valid:',
        this.addProjectForm.get('endYear')?.valid,
        this.addProjectForm.get('endMonth')?.valid,
        this.addProjectForm.get('endDay')?.valid
      );

      // Get specific validation errors to show a more helpful message
      const errorFields = [];

      if (this.addProjectForm.get('title')?.invalid) {
        errorFields.push('Title');
      }
      if (this.addProjectForm.get('summary')?.invalid) {
        errorFields.push('Summary');
      }
      if (
        this.addProjectForm.get('startYear')?.invalid ||
        this.addProjectForm.get('startMonth')?.invalid ||
        this.addProjectForm.get('startDay')?.invalid
      ) {
        errorFields.push('Start Date');
      }

      // For end date, only check if isContinuous is false
      const isContinuing = this.addProjectForm.get('isContinuous')?.value;
      if (!isContinuing) {
        // When not ongoing, check all end date fields
        if (
          this.addProjectForm.get('endYear')?.invalid ||
          this.addProjectForm.get('endMonth')?.invalid ||
          this.addProjectForm.get('endDay')?.invalid
        ) {
          errorFields.push('End Date');
        }
      }

      // Set a more specific error message
      if (errorFields.length > 0) {
        this.addProjectError.set(
          `Please fill in all required fields: ${errorFields.join(', ')}`
        );
      } else {
        this.addProjectError.set(
          'Please fill in all required fields correctly'
        );
      }
      return;
    }

    // Reset state
    this.addProjectLoading.set(true);
    this.addProjectSuccess.set(null);
    this.addProjectError.set(null);

    // Prepare the form data
    const payload = this.prepareProjectFormData();
    console.log('Submitting payload:', payload);

    // Use the HttpService to make the POST request
    this.httpService.post('project', payload).subscribe({
      next: (result) => {
        this.zone.run(() => {
          console.log('Project added successfully:', result);
          // Update success signal with the result data
          this.addProjectSuccess.set(result);

          // Update loading state
          this.addProjectLoading.set(false);

          // Don't reset the form immediately - let the user see the success message
          setTimeout(() => {
            this.resetAddProjectForm(false); // Pass false to not clear success message
          }, 5000); // Wait 5 seconds before resetting the form
        });
      },
      error: (error) => {
        this.zone.run(() => {
          console.error('Error adding project:', error);

          // Set error message
          this.addProjectError.set(
            `Failed to add project: ${error.error?.message || 'Unknown error'}`
          );

          // Update loading state
          this.addProjectLoading.set(false);
        });
      },
    });
  }

  /**
   * Helper method to prepare project form data by removing empty array items
   */
  prepareProjectFormData() {
    // Get both regular and disabled controls
    const formData = {
      ...this.addProjectForm.getRawValue(), // This gets values from both enabled and disabled controls
    };

    // If project is ongoing, ensure end date fields are not included
    if (formData.isContinuous === true) {
      delete formData.endYear;
      delete formData.endMonth;
      delete formData.endDay;
    }

    // Filter out null values and empty arrays
    const result: Record<string, any> = {};

    Object.entries(formData).forEach(([key, value]) => {
      // Skip null values
      if (value === null) {
        return;
      }

      // Handle keywords array specially
      if (key === 'keywords' && Array.isArray(value)) {
        // Filter out empty keywords
        const filteredKeywords = value.filter(
          (keyword) => keyword && keyword.trim() !== ''
        );

        // Only add keywords if there are any non-empty ones
        if (filteredKeywords.length > 0) {
          result[key] = filteredKeywords;
        }
        return;
      }

      // Add all other non-null values
      result[key] = value;
    });

    return result;
  }

  /**
   * Reset the project form to its initial state
   */
  resetAddProjectForm(resetMessages = true) {
    // Clear the form
    this.addProjectForm.reset({
      public: false,
      isContinuous: false,
    });

    // Only reset success/error states if specified
    if (resetMessages) {
      this.addProjectSuccess.set(null);
      this.addProjectError.set(null);
    }

    // Reset keywords array to initial state with just one empty entry
    const keywordsArray = this.addProjectForm.get('keywords') as FormArray;
    while (keywordsArray.length > 0) {
      keywordsArray.removeAt(0);
    }
    keywordsArray.push(this.fb.control(null));

    // Reset validators for end date fields based on isContinuous value
    this.updateEndDateValidators(
      this.addProjectForm.get('isContinuous')?.value
    );
  }

  // Add these getter methods to access the form arrays
  get projectKeywordsArray(): FormArray {
    return this.addProjectForm.get('keywords') as FormArray;
  }

  // Add methods to add/remove items from the keywords array
  addProjectKeyword() {
    this.projectKeywordsArray.push(this.fb.control(null));
  }

  removeProjectKeyword(index: number) {
    if (this.projectKeywordsArray.length > 1) {
      this.projectKeywordsArray.removeAt(index);
    }
  }

  /**
   * Update the project start date fields when the date input changes
   * @param event The change event
   */
  updateProjectStartDate(event: Event): void {
    const dateValue = (event.target as HTMLInputElement).value;

    if (dateValue) {
      // Create date object at noon to avoid timezone issues
      const date = new Date(`${dateValue}T12:00:00`);

      // Extract date components in local timezone
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      // Update form controls
      this.addProjectForm.patchValue({
        startYear: year,
        startMonth: month,
        startDay: day,
      });

      console.log(`Start date set to: ${year}-${month}-${day}`);
    } else {
      // If date is cleared, reset all fields
      this.addProjectForm.patchValue({
        startYear: null,
        startMonth: null,
        startDay: null,
      });
    }
  }

  /**
   * Update the project end date fields when the date input changes
   * @param event The change event
   */
  updateProjectEndDate(event: Event): void {
    const dateValue = (event.target as HTMLInputElement).value;

    if (dateValue) {
      // Create date object at noon to avoid timezone issues
      const date = new Date(`${dateValue}T12:00:00`);

      // Extract date components in local timezone
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      // Update form controls
      this.addProjectForm.patchValue({
        endYear: year,
        endMonth: month,
        endDay: day,
      });

      console.log(`End date set to: ${year}-${month}-${day}`);
    } else {
      // If date is cleared, reset all fields
      this.addProjectForm.patchValue({
        endYear: null,
        endMonth: null,
        endDay: null,
      });
    }
  }

  /**
   * Format the date components into a string for the date input
   * @param year The year value
   * @param month The month value (1-12)
   * @param day The day value
   * @returns A date string in YYYY-MM-DD format
   */
  formatProjectDate(
    year: number | null,
    month: number | null,
    day: number | null
  ): string {
    if (!year || !month || !day) {
      return '';
    }

    // Format month and day to ensure they have two digits
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }
  onDeadlineTypeChange() {
    const deadlineTypeControl = this.addGrantForm.get('deadlineType');

    if (!deadlineTypeControl) {
      return; // Exit if the control doesn't exist
    }

    const deadlineType = deadlineTypeControl.value;

    if (deadlineType === 'Continuous') {
      // Clear all application deadlines when continuous is selected
      const deadlinesArray = this.addGrantForm.get(
        'applicationDeadlines'
      ) as FormArray;

      if (!deadlinesArray) {
        return; // Exit if the form array doesn't exist
      }

      // Loop through all deadline sets and clear their values
      for (let i = 0; i < deadlinesArray.length; i++) {
        const deadlineGroup = deadlinesArray.at(i) as FormGroup;

        // Add null checks for each control
        const applicationDeadlineControl = deadlineGroup.get(
          'applicationDeadline'
        );
        if (applicationDeadlineControl) {
          applicationDeadlineControl.setValue(null);
        }

        const registrationDeadlineControl = deadlineGroup.get(
          'registrationOfIntentDeadline'
        );
        if (registrationDeadlineControl) {
          registrationDeadlineControl.setValue(null);
        }
      }
    }
  }
}
