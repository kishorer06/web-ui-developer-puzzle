import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  addToReadingList,
  clearSearch,
  getAllBooks,
  ReadingListBook,
  searchBooks,
  removeFromReadingList
} from '@tmo/books/data-access';
import { FormBuilder } from '@angular/forms';
import { Book, ReadingListItem } from '@tmo/shared/models';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'tmo-book-search',
  templateUrl: './book-search.component.html',
  styleUrls: ['./book-search.component.scss']
})
export class BookSearchComponent implements OnInit {
  books: ReadingListBook[];
  instantSearch: string;
  instantSearchChanged = new Subject<string>();
  searchForm = this.fb.group({
    term: ''
  });
  undo: boolean;

  constructor(
    private readonly store: Store,
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar
  ) {
    this.instantSearchChanged.pipe(debounceTime(500)).subscribe(() => {
      this.store.dispatch(searchBooks({ term: this.instantSearch }));
    });
  }

  get searchTerm(): string {
    return this.searchForm.value.term;
  }

  ngOnInit(): void {
    this.store.select(getAllBooks).subscribe(books => {
      this.books = books;
    });
  }

  formatDate(date: void | string) {
    return date
      ? new Intl.DateTimeFormat('en-US').format(new Date(date))
      : undefined;
  }

  addBookToReadingList(book: Book, addedItemText: string) {
    this.undo = false;
    this.store.dispatch(addToReadingList({ book }));
    let snackBarRef = this.snackBar.open(addedItemText, 'Undo', {
      duration: 2000,
    });
    snackBarRef.onAction().subscribe(() => {
      this.removeBookFromReadingList(book, "Removed from the List");
      this.undo = true;
    });
  }

  removeBookFromReadingList(book: Book, removeItemText: string) {
    this.undo = false;
    const item = <ReadingListItem>{};
    item.bookId = book.id;
    this.store.dispatch(removeFromReadingList({ item }));
    let snackBarRef = this.snackBar.open(removeItemText, 'Undo', {
      duration: 2000,
    });
    snackBarRef.onAction().subscribe(() => {
      this.addBookToReadingList(book, 'Added to the List');
      this.undo = true;
    });
  }

  searchExample() {
    this.searchForm.controls.term.setValue('javascript');
    this.searchBooks();
  }

  instantSearchBooks() {
    this.instantSearchChanged.next();
  }

  searchBooks() {
    if (this.searchForm.value.term) {
      this.store.dispatch(searchBooks({ term: this.searchTerm }));
    } else {
      this.store.dispatch(clearSearch());
    }
  }
}
