import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForwardEngineeringComponent } from './forward-engineering.component';

describe('ForwardEngineeringComponent', () => {
  let component: ForwardEngineeringComponent;
  let fixture: ComponentFixture<ForwardEngineeringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForwardEngineeringComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForwardEngineeringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
