import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationDisplayComponent } from './animation-display.component';

describe('AnimationDisplayComponent', () => {
  let component: AnimationDisplayComponent;
  let fixture: ComponentFixture<AnimationDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnimationDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimationDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
