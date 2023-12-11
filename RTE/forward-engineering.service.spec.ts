import { TestBed } from '@angular/core/testing';

import { ForwardEngineeringService } from './forward-engineering.service';

describe('ForwardEngineeringService', () => {
  let service: ForwardEngineeringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForwardEngineeringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
