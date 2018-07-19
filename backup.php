<?php
  if(array_key_exists('glob',$_GET)){
    $arr=glob(dirname(__FILE__)."/*");
    if(array_key_exists('json',$_GET)){header("content-type: text/plain");echo json_encode($arr);exit();}
    echo "<pre>".implode($arr,"\n")."\n\n";
    exit();
  }
  function f($fn,$del){return count(explode($del,$fn));}
  if(array_key_exists('data',$_POST)){
    $fn=array_key_exists('fn',$_POST)?$_POST['fn']:"g_obj.json";
    if(f($fn,"/")>1||f($fn,"\\")>1||f($fn,".")>2||f($fn,".json")<1){
      echo "wrong fn, but ok, let's use default(g_obj.json)\n";$fn="g_obj.json";
    }
    file_put_contents(dirname(__FILE__)."/".$fn,$_POST['data']);
    file_put_contents(dirname(__FILE__)."/last_backup_fn.txt",$fn);
    echo "done!\n";
  }
  echo "---\nend!";
  /*
    echo "<pre>".implode("\n",glob("*"));
       $need_delete_all_json_files_in_concreate_folder=true;
    if($need_delete_all_json_files_in_concreate_folder)
    {
      echo "<pre>before:\n";
      echo implode(glob("vm/backup/*"),"\n");
      echo "\n\nunlinking...\n";
      $a=glob("vm/backup/*");
      foreach($a as $k=>$v)if(strpos($v,'json')!==false)unlink($v);
      echo "done\nafter:\n";
      echo implode(glob("vm/backup/*"),"\n");
    }
  */
?>
